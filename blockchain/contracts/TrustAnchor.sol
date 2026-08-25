// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/// @title TrustAnchor
/// @notice Blockchain trust layer for the Smart Tourist Safety Monitoring &
///         Incident Response System (SIH25002). Stores hashes plus append-only
///         AES-GCM encrypted identity/group snapshots. Raw plaintext PII, GPS
///         coordinates, evidence bytes and free-text reasons are never stored.
/// @dev    All state-changing functions are restricted to authorized
///         issuer accounts controlled by the backend. Tourists never
///         interact with this contract directly and never hold a wallet.
contract TrustAnchor {
    // ---------------------------------------------------------------
    // Types
    // ---------------------------------------------------------------

    enum IdStatus {
        ACTIVE,
        REVOKED,
        EXPIRED
    }

    struct DigitalId {
        bytes32 tripHash;
        uint64 issuedAt;
        uint64 expiresAt;
        IdStatus status;
        address issuer;
        uint8 version;
    }

    struct DataSnapshot {
        bytes32 payloadHash;
        bytes encryptedPayload;
        uint64 anchoredAt;
        uint32 sequence;
        uint8 snapshotType;
    }

    // ---------------------------------------------------------------
    // State
    // ---------------------------------------------------------------

    /// @notice idHash => digital ID record
    mapping(bytes32 => DigitalId) public ids;

    /// @notice Credential/group ID hash => append-only encrypted snapshots.
    mapping(bytes32 => DataSnapshot[]) private dataSnapshots;

    /// @notice evidenceHash => whether it has been anchored
    mapping(bytes32 => bool) public evidenceAnchors;
    /// @notice evidenceHash => block timestamp it was first anchored at
    mapping(bytes32 => uint64) public evidenceAnchoredAt;

    /// @notice incidentHash => whether it has been anchored
    mapping(bytes32 => bool) public incidentAnchors;
    /// @notice incidentHash => block timestamp it was first anchored at
    mapping(bytes32 => uint64) public incidentAnchoredAt;

    /// @notice consentHash => whether it has been anchored
    mapping(bytes32 => bool) public consentAnchors;
    /// @notice consentHash => block timestamp it was first anchored at
    mapping(bytes32 => uint64) public consentAnchoredAt;

    /// @notice allow-list of addresses permitted to call state-changing
    ///         functions (backend-controlled issuer accounts / agency keys)
    mapping(address => bool) public authorizedIssuers;

    /// @notice contract admin — set at deployment, rotates issuers
    address public admin;

    // ---------------------------------------------------------------
    // Events
    // ---------------------------------------------------------------

    event IdIssued(
        bytes32 indexed idHash,
        bytes32 indexed tripHash,
        address indexed issuer,
        uint64 issuedAt,
        uint64 expiresAt,
        uint8 version
    );

    event IdRevoked(
        bytes32 indexed idHash,
        uint8 reasonCode,
        address indexed revoker,
        uint64 revokedAt
    );

    event IdExtended(
        bytes32 indexed idHash,
        uint64 previousExpiresAt,
        uint64 expiresAt,
        address indexed actor
    );

    event DataSnapshotAnchored(
        bytes32 indexed idHash,
        bytes32 indexed payloadHash,
        uint32 sequence,
        uint8 snapshotType,
        uint64 anchoredAt,
        address indexed actor
    );

    event EvidenceAnchored(
        bytes32 indexed evidenceHash,
        address indexed actor,
        uint64 anchoredAt,
        uint8 version
    );

    event IncidentAnchored(
        bytes32 indexed incidentHash,
        address indexed actor,
        uint64 anchoredAt,
        uint8 version
    );

    event ConsentAnchored(
        bytes32 indexed consentHash,
        address indexed actor,
        uint64 anchoredAt,
        uint8 version
    );

    event IssuerAuthorized(address indexed issuer);
    event IssuerRevoked(address indexed issuer);

    // ---------------------------------------------------------------
    // Modifiers
    // ---------------------------------------------------------------

    modifier onlyAuthorizedIssuer() {
        require(authorizedIssuers[msg.sender], "NOT_AUTHORIZED_ISSUER");
        _;
    }

    modifier onlyAdmin() {
        require(msg.sender == admin, "NOT_ADMIN");
        _;
    }

    // ---------------------------------------------------------------
    // Constructor
    // ---------------------------------------------------------------

    constructor() {
        admin = msg.sender;
        authorizedIssuers[msg.sender] = true;
        emit IssuerAuthorized(msg.sender);
    }

    // ---------------------------------------------------------------
    // Issuer management
    // ---------------------------------------------------------------

    /// @notice Authorize a new backend/agency signing key.
    function authorizeIssuer(address issuer) external onlyAdmin {
        require(issuer != address(0), "ZERO_ADDRESS");
        authorizedIssuers[issuer] = true;
        emit IssuerAuthorized(issuer);
    }

    /// @notice Revoke a compromised or retired backend/agency signing key.
    function revokeIssuer(address issuer) external onlyAdmin {
        authorizedIssuers[issuer] = false;
        emit IssuerRevoked(issuer);
    }

    // ---------------------------------------------------------------
    // Digital ID lifecycle
    // ---------------------------------------------------------------

    /// @notice Anchor a new digital tourist ID verification proof.
    /// @dev    Issuance is one-shot per idHash. A re-issued ID after
    ///         revocation must use a NEW idHash so history is preserved.
    function issueId(
        bytes32 idHash,
        bytes32 tripHash,
        uint64 issuedAt,
        uint64 expiresAt,
        uint8 version
    ) external onlyAuthorizedIssuer {
        require(ids[idHash].issuer == address(0), "ID_ALREADY_ISSUED");
        require(expiresAt > issuedAt, "INVALID_WINDOW");

        ids[idHash] = DigitalId({
            tripHash: tripHash,
            issuedAt: issuedAt,
            expiresAt: expiresAt,
            status: IdStatus.ACTIVE,
            issuer: msg.sender,
            version: version
        });

        emit IdIssued(idHash, tripHash, msg.sender, issuedAt, expiresAt, version);
    }

    /// @notice Extend the validity window of an active trip credential.
    /// @dev    Used when the backend extends a trip. The identifier/hash never changes.
    function extendId(bytes32 idHash, uint64 expiresAt)
        external
        onlyAuthorizedIssuer
    {
        DigitalId storage record = ids[idHash];
        require(record.issuer != address(0), "ID_NOT_FOUND");
        require(record.status == IdStatus.ACTIVE, "ID_NOT_ACTIVE");
        require(expiresAt > record.expiresAt, "EXPIRY_NOT_EXTENDED");

        uint64 previousExpiresAt = record.expiresAt;
        record.expiresAt = expiresAt;
        emit IdExtended(idHash, previousExpiresAt, expiresAt, msg.sender);
    }

    /// @notice Revoke an active digital ID. Reason TEXT stays off-chain —
    ///         only a numeric reasonCode is ever anchored.
    function revokeId(bytes32 idHash, uint8 reasonCode)
        external
        onlyAuthorizedIssuer
    {
        DigitalId storage record = ids[idHash];
        require(record.issuer != address(0), "ID_NOT_FOUND");
        require(record.status == IdStatus.ACTIVE, "ID_NOT_ACTIVE");

        record.status = IdStatus.REVOKED;

        emit IdRevoked(idHash, reasonCode, msg.sender, uint64(block.timestamp));
    }

    /// @notice Read-only verification of a digital ID's current status.
    /// @dev    Applies lazy expiry: if the validity window has passed but
    ///         the record still says ACTIVE in storage, this returns
    ///         EXPIRED without mutating state (view functions cannot write).
    function verifyId(bytes32 idHash)
        external
        view
        returns (
            IdStatus status,
            address issuer,
            uint64 issuedAt,
            uint64 expiresAt,
            uint8 version
        )
    {
        DigitalId storage record = ids[idHash];

        IdStatus effectiveStatus = record.status;
        if (
            effectiveStatus == IdStatus.ACTIVE &&
            block.timestamp >= record.expiresAt &&
            record.issuer != address(0)
        ) {
            effectiveStatus = IdStatus.EXPIRED;
        }

        return (
            effectiveStatus,
            record.issuer,
            record.issuedAt,
            record.expiresAt,
            record.version
        );
    }

    // ---------------------------------------------------------------
    // Append-only encrypted identity/group snapshots
    // ---------------------------------------------------------------

    function appendDataSnapshot(
        bytes32 idHash,
        bytes32 payloadHash,
        bytes calldata encryptedPayload,
        uint32 sequence,
        uint8 snapshotType
    ) external onlyAuthorizedIssuer {
        require(ids[idHash].issuer != address(0), "ID_NOT_FOUND");
        require(encryptedPayload.length > 0, "EMPTY_SNAPSHOT");
        require(sequence == dataSnapshots[idHash].length + 1, "INVALID_SNAPSHOT_SEQUENCE");

        dataSnapshots[idHash].push(DataSnapshot({
            payloadHash: payloadHash,
            encryptedPayload: encryptedPayload,
            anchoredAt: uint64(block.timestamp),
            sequence: sequence,
            snapshotType: snapshotType
        }));

        emit DataSnapshotAnchored(idHash, payloadHash, sequence, snapshotType, uint64(block.timestamp), msg.sender);
    }

    function getDataSnapshotCount(bytes32 idHash) external view returns (uint256) {
        return dataSnapshots[idHash].length;
    }

    function getLatestDataSnapshot(bytes32 idHash)
        external
        view
        returns (bytes32 payloadHash, bytes memory encryptedPayload, uint64 anchoredAt, uint32 sequence, uint8 snapshotType)
    {
        uint256 count = dataSnapshots[idHash].length;
        require(count > 0, "SNAPSHOT_NOT_FOUND");
        DataSnapshot storage snapshot = dataSnapshots[idHash][count - 1];
        return (snapshot.payloadHash, snapshot.encryptedPayload, snapshot.anchoredAt, snapshot.sequence, snapshot.snapshotType);
    }

    function getDataSnapshot(bytes32 idHash, uint256 index)
        external
        view
        returns (bytes32 payloadHash, bytes memory encryptedPayload, uint64 anchoredAt, uint32 sequence, uint8 snapshotType)
    {
        require(index < dataSnapshots[idHash].length, "SNAPSHOT_NOT_FOUND");
        DataSnapshot storage snapshot = dataSnapshots[idHash][index];
        return (snapshot.payloadHash, snapshot.encryptedPayload, snapshot.anchoredAt, snapshot.sequence, snapshot.snapshotType);
    }

    // ---------------------------------------------------------------
    // Evidence / Incident / Consent anchoring
    // ---------------------------------------------------------------

    /// @notice Anchor a checksum proving an evidence file existed at this
    ///         point in time, without publishing its bytes. Idempotent:
    ///         re-anchoring the same hash is a silent no-op, never a revert.
    function anchorEvidence(bytes32 evidenceHash, uint8 version)
        external
        onlyAuthorizedIssuer
    {
        if (evidenceAnchors[evidenceHash]) {
            return;
        }
        evidenceAnchors[evidenceHash] = true;
        evidenceAnchoredAt[evidenceHash] = uint64(block.timestamp);
        emit EvidenceAnchored(evidenceHash, msg.sender, uint64(block.timestamp), version);
    }

    /// @notice Anchor a hashed incident-timeline snapshot. Idempotent, same
    ///         pattern as anchorEvidence.
    function anchorIncident(bytes32 incidentHash, uint8 version)
        external
        onlyAuthorizedIssuer
    {
        if (incidentAnchors[incidentHash]) {
            return;
        }
        incidentAnchors[incidentHash] = true;
        incidentAnchoredAt[incidentHash] = uint64(block.timestamp);
        emit IncidentAnchored(incidentHash, msg.sender, uint64(block.timestamp), version);
    }

    /// @notice Anchor a consent/access receipt hash. Idempotent, same
    ///         pattern as anchorEvidence.
    function anchorConsent(bytes32 consentHash, uint8 version)
        external
        onlyAuthorizedIssuer
    {
        if (consentAnchors[consentHash]) {
            return;
        }
        consentAnchors[consentHash] = true;
        consentAnchoredAt[consentHash] = uint64(block.timestamp);
        emit ConsentAnchored(consentHash, msg.sender, uint64(block.timestamp), version);
    }

    /// @notice Read-only check of an evidence anchor.
    function verifyEvidence(bytes32 evidenceHash)
        external
        view
        returns (bool exists, uint64 anchoredAt)
    {
        return (evidenceAnchors[evidenceHash], evidenceAnchoredAt[evidenceHash]);
    }

    /// @notice Read-only check of an incident anchor.
    function verifyIncident(bytes32 incidentHash)
        external
        view
        returns (bool exists, uint64 anchoredAt)
    {
        return (incidentAnchors[incidentHash], incidentAnchoredAt[incidentHash]);
    }

    /// @notice Read-only check of a consent anchor.
    function verifyConsent(bytes32 consentHash) external view returns (bool exists) {
        return consentAnchors[consentHash];
    }
}
