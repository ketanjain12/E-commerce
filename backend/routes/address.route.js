// // export default router;
// import express from "express";
// import {
//     addAddress,
//     updateAddress,
//     deleteAddress,
//     getAddressById,
//     getAllAddressesByUser
// } from "../controllers/address.controller.js";

// const router = express.Router();

// router.post("/add",
//     [
//                 body("street").notEmpty().withMessage("Street is required"),
//                 body("city").notEmpty().withMessage("City is required"),
//                 body("state").notEmpty().withMessage("State is required"),
//                 body("country").notEmpty().withMessage("Country is required"),
//                 body("postalCode")
//                     .notEmpty()
//                     .withMessage("Postal code is required")
//                     .isPostalCode("any")
//                     .withMessage("Invalid postal code"),
//             ],
//     addAddress);          // Add address
// router.put("/update/:addressId", 
//     [
//                 param("addressId").isMongoId().withMessage("Invalid Address ID"),
//                 body("street").optional().notEmpty().withMessage("Street cannot be empty"),
//                 body("city").optional().notEmpty().withMessage("City cannot be empty"),
//                 body("state").optional().notEmpty().withMessage("State cannot be empty"),
//                 body("country").optional().notEmpty().withMessage("Country cannot be empty"),
//                 body("postalCode").optional().isPostalCode("any").withMessage("Invalid postal code"),
//             ],
//     updateAddress); // Update address
// router.delete("/delete/:addressId",
//         [param("addressId").isMongoId().withMessage("Invalid Address ID")],

//     deleteAddress); // Delete address
// router.get("/get/:addressId",
//         [param("addressId").isMongoId().withMessage("Invalid Address ID")],
//     getAddressById); // Get address by ID
// router.get("/user", getAllAddressesByUser);   // Get all addresses by user

// export default router;

// new 
import express from "express";
import { addAddress, updateAddress, deleteAddress, getAddressById, getUserAddresses } from "../controllers/address.controller.js";

const router = express.Router();

// ✅ Define routes
router.post("/add", addAddress);          // Add address
router.put("/update/:addressId", updateAddress); // Update address
router.delete("/delete/:addressId", deleteAddress); // Delete address
router.get("/get/:addressId", getAddressById); // Get address by ID
router.get("/user", getUserAddresses);   // Get all addresses by user

export default router;
