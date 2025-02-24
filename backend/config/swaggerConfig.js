import swaggerJSDoc from "swagger-jsdoc";
import swaggerUI from "swagger-ui-express";

const options={
    definition: {
      openapi: "3.0.0",
      info: {
        title: "E-commerce Store API",
        version: "1.0.0",
        description: "API documentation for E-commerce Store backend",
      },
      servers:[
        {
            url:"http://localhost:3000/api",
            description:"local/development Server"
        },
      ],
    },
    apis:["../controllers/*.js"], // Pointing to all controller files
};
const swaggerSpec = swaggerJSDoc(options);

export const setUpSwagger = (app)=>{

  app.use("/api/docs",swaggerUI.serve,swaggerUI.setup(swaggerSpec));

}