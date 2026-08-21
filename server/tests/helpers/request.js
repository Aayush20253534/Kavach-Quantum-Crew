import supertest from "supertest";

export const request = (app) => supertest(app);

export default request;
