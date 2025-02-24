import { redis } from "../lib/redis.js";
import Product from "../models/product.model.js";
import  cloudinary  from "../lib/cloudinary.js";

// only admin called this function to get all products
// admin should be able to see all the products in admin panel

/**
 * @function getAllProducts
 * @description This function is used to fetch all the products from the application. Only the admin should have access to this route.
 * @param {Object} res - The response object.
 * @param {Object} req - The request object.
 * @returns {Object} - The response object with all the products.
 */
export const getAllProducts = async(res,req)=>{

    try {
        const products = await Product.find({}); // find all products 
  
        res.status(201).json({
            status:true,
            msg:"All Product details fetched successfully ",
            Products:products
        })

    } catch (error) {

        console.log("server error",error.message);
      return  res.status(500).json({
            status:false,
            msg:"failed to fetched product" + error.message
            
        })

    }

}

/**
 * @function getFeaturedProducts
 * @description This function returns the featured products in the application. If the featured products are already stored in Redis, it fetches them from Redis. If not, it fetches them from the MongoDB database using Mongoose, stores them in Redis for future quick access, and returns them in the response.
 * @param {Object} res - The response object.
 * @param {Object} req - The request object.
 * @returns {Object} - The response object with the featured products.
 */
export const getFeaturedProducts = async(req,res)=>{
try {
    let featuredProducts = await redis.get("featured_products");
    if(featuredProducts){
        return res.json(JSON.parse(featuredProducts)) // parse use here beacuse redis store as string
    }

    // if not in redis fetch from mongoose db 
    featuredProducts = await Product.find({isFeatured:true}).lean();

    //The .lean() function is used in Mongoose to convert Mongoose documents into plain JavaScript objects.

    // When Should You Use .lean()?
    // ✅ When you only need to read data and don’t plan to modify/save it.
    // ✅ When you don’t need Mongoose features like .save(), .populate(), etc.
    // ✅ When you want to improve query performance by reducing processing time.

    // When Should You NOT Use .lean()?
    // ❌ When you plan to modify and save the document later (because .lean() removes Mongoose functions).
    // ❌ When you need virtuals, middleware, or getters/setters (because .lean() skips these).
    
    

    if(!featuredProducts){
        return res.status(404).json({
            status: false,
            msg: "No featuredProducts found: "
          });
    }

 // store in redis for future quick access

 await redis.set("featured_products",JSON.stringify(featuredProducts))

 res.json(featuredProducts);

} catch (error) {

    console.log("error in get featuredProducts",error.message);

      return  res.status(500).json({
            status:false,
            msg:"failed to fetched product" + error.message
        })
}
}


export const createProduct = async(req,res)=>{

try {

    const {name,description,image,price,category} = req.body; // isFeatured bydefault false admin can chnage this from frontend side

    let cloudinaryResponse = null ;

    if(image){
    let cloudinaryResponse = await cloudinary.uploader.upload(image,{folder:"products"})
    }
   // now create db 
  //  🚫 Mistake:

// .create() is NOT used with new.
// .create() is a static method and should be called directly.

   const product = await Product.create({
    name,
    description,
    image:cloudinaryResponse?.secure_url?cloudinaryResponse.secure_url : " " ,
    price,
    category  // use for products  
   })
   res.status(201).json({
    status:true,
    msg:"product create  successfully ",
    Product:product
})
} catch (error) {
    console.log("server error",error.message);
      return res.status(500).json({
            status:false,
            msg:"failed to create product" + error.message
            
        })
}
}

// keep in mind one thing that when we deleted any product from the db also we will need to delete images from the cloudnary
/**
 * @function deleteProduct
 * @description Deletes a product by its ID. If the product includes an image, 
 * the image is also deleted from Cloudinary. If the product is not found, 
 * returns a 404 error. If successful, returns a confirmation message.
 * @param {Object} res - The response object.
 * @param {Object} req - The request object.
 * @throws {Error} Throws a 500 error if the product deletion fails.
 */


/**
 * Deletes a product by its ID. If the product includes an image, 
 * the image is also deleted from Cloudinary. If the product is not found, 
 * returns a 404 error. If successful, returns a confirmation message.
 * @param {Object} res - The response object.
 * @param {Object} req - The request object.
 * @throws {Error} Throws a 500 error if the product deletion fails.
 */
export const deleteProduct = async(req,res)=>{

try {
    const product = await Product.findById(re.params.id);
    if(!product){
     return res.status(404).json({
         status:true,
         msg:" Product not found "
         
     })
    }
 
    if(product.image){ // image reqyured fiekd and isko bi clounary se delete karna h 
 
    const publicId = product.image.split("/").pop().split(".")[0]; // this will get the id of the image 
 
    try {
 
     await cloudinary.uploader.destroy(`products/${publicId}`) // delete images 
     console.log("deleted image from clouinary ")
     
    } catch (error) {
     console.log("error in deleted image from clouinary ",error.message)
 
    }
  // delete as well from the db 
  await Product.findByIdAndDelete(req.params.id)
   
  res.status(201).json({
     status:true,
     msg:" Product deleted successfully "
     
 })
 
    }
} catch (error) {
    console.log("server error",error.message);
      return  res.status(500).json({
            status:false,
            msg:"failed to Product deleted" + error.message
            
        })
}
  
}


/**
 * Fetches 3 random products from the database. Uses the MongoDB aggregation 
 * pipeline to get 3 products using the `$sample` operator. 
 * @param {Object} res - The response object.
 * @param {Object} req - The request object.
 * @throws {Error} Throws a 500 error if the product fetch fails.
 * @returns {Object} - The response object with 3 products.
 */
export const getRecommendations = async(req,res)=>{

  // here using aggregation pipeline from the mongodb 
   
  try {
    const products= await Product.aggregate([  // takes an array in the first argument 
   // we put object here 
   {
    $sample:{size:3}  // diff types of 3 product 
   },
   {
     $project:{
        // this will get 3 diff products and we wiil have  the like these fields populated into it 
        _id:1,
        name:1,
        description:1,
        image:1,
        price:1
     }
   }
    ])

    res.status(201).json({
        status:true,
        msg:"fetch 3 products successfully",
        products:products
    })
  } catch (error) {
    console.log("server error",error.message);
    return  res.status(500).json({
          status:false,
          msg:"failed to fetch 3 product" + error.message
          
      })
  }

}

/**
 * @function getProductsByCategory
 * @description Fetches products from the database based on the specified category.
 * @param {Object} res - The response object used to send the HTTP response.
 * @param {Object} req - The request object containing the category in the params.
 * @returns {Object} - JSON response with the status, message, and list of products.
 * @throws {Error} - Returns a 500 error if there is a server error during the operation.
 */

/**
 * @function getProductsByCategory
 * @description Fetches products from the database based on the specified category.
 * @param {Object} res - The response object used to send the HTTP response.
 * @param {Object} req - The request object containing the category in the params.
 * @returns {Object} - JSON response with the status, message, and list of products.
 * @throws {Error} - Returns a 500 error if there is a server error during the operation.
 */
export const getProductsByCategory = async (req,res) => {
  try {
    // Destructure the category from the request params
    const { category } = req.params;

    // Find all products in the database that match the category
    const products = await Product.find({ category });

    // If we found products, return them in the response
    if (products) {
      res.status(201).json({
        status: true,
        msg: "category product fetched successfully",
        data: products // Return the products in the response
      });
    } else {
      // If we didn't find any products, return a 404 error
      res.status(404).json({
        status: false,
        msg: "No products found for the given category"
      });
    }

  } catch (error) {
    // Catch any server errors and log them
    console.log("server error in getProductsByCategory ketan controller", error.message);

    // Return a 500 error with the error message
    return res.status(500).json({
      status: false,
      msg: "server error in getProductsByCategory controller" + error.message
    });
  }
};

// This function toggles the 'isFeatured' status of a product by its ID.
// If the product is found, it updates the status and saves it to the database.
// The updated product is then used to update the cache.
// If the product is not found, it returns a 404 error.
// Any server errors are caught and logged, with a 500 error response sent back.

export const toggleFeaturedProduct = async (req,res) => {
  try {
    // Find the product by ID from the database
    const product = await Product.findById(req.params.id);

    if (product) {
      // Toggle the 'isFeatured' status
      product.isFeatured = !product.isFeatured;

      // Save the updated product to the database
      const updatedProduct = await product.save();

      // Log the updated product for debugging purposes
      console.log("Updated Product:", updatedProduct);

      // Update the featured products cache in Redis
      await updateFeaturedProductsCache();

      // Send the updated product in the response
      res.json(updatedProduct);
    } else {
      // If the product is not found, return a 404 error
      res.status(404).json({
        status: false,
        msg: "No product found",
      });
    }
  } catch (error) {
    // Log the error message for debugging
    console.log("Error in toggleFeaturedProduct controller", error.message);

    // Return a 500 error response for server errors
    return res.status(500).json({
      status: false,
      msg: "Server error in toggleFeaturedProduct controller: " + error.message,
    });
  }
};

//  logic of   const publicId = product.image.split("/").pop().split(".")[0];
 
// export empty application(req,res)=>{
//     const function=>(
//         const publicId = product.image.split("/").pop().split(".")[0]; explain me this line in details 
     
//         const publicId = product.image.split("/").pop().split(".")[0];
//         This line extracts the public ID of an image URL by manipulating the string. Let's break it down step by step.
        
//         Step-by-Step Explanation
//         1️⃣ product.image.split("/")
//         👉 This splits the image URL into an array using / as a delimiter.
    
//         const product = { image: "https://res.cloudinary.com/demo/image/upload/v1620012345/sample-image.jpg" };
//         const parts = product.image.split("/");
//         console.log(parts);
    
//         [
//           'https:', '', 'res.cloudinary.com', 'demo', 'image', 'upload',
//           'v1620012345', 'sample-image.jpg'
//         ]
//         📌 Now, the last element in this array is "sample-image.jpg" (the filename).
        
//         2️⃣ .pop()
//         👉 .pop() removes and returns the last element of the array.
        
    
//         const filename = product.image.split("/").pop();
//         console.log(filename); 
     
//         "sample-image.jpg"
//         📌 Now we have only the filename: "sample-image.jpg"
        
//         3️⃣ .split(".")
//         👉 Now, we split the filename by . to separate the file extension from the actual name.
        
      
//         const nameParts = filename.split(".");
//         console.log(nameParts);
        
//         ["sample-image", "jpg"]
//         📌 The first part is the public ID, and the second part is the file extension.
        
//         4️⃣ [0] (Selecting the First Part)
//         👉 Finally, [0] selects only the first part of the array, which is the public ID.
        
       
//         const publicId = nameParts[0];
//         console.log(publicId);
//         🔹 Output:
        
//         "sample-image"
//         📌 Now, we have successfully extracted "sample-image", which is the public ID of the image.
        
//         🔹 Final Summary
      
//         const publicId = product.image.split("/").pop().split(".")[0];
//         ✔ Extracts the filename from the image URL.
//         ✔ Removes the extension (.jpg, .png, etc.).
//         ✔ Returns the public ID (which is commonly used in Cloudinary or other file storage services).
        
//         🔹 Example with Another URL
//  
//         const product = { image: "https://example.com/uploads/product-123.png" };
//         const publicId = product.image.split("/").pop().split(".")[0];
//         console.log(publicId);
//         🔹 Output:
        
//         "product-123"
//         Example 2 (Cloudinary URL):
//   
//         const product = { image: "https://res.cloudinary.com/demo/image/upload/v1620012345/sample-product.jpg" };
//         const publicId = product.image.split("/").pop().split(".")[0];
//         console.log(publicId);
//         🔹 Output:
        
//         "sample-product"
//         ✅ Conclusion
//         This technique is useful when working with file uploads, Cloudinary images, or media files where you need to extract the filename (public ID) without the extension.
        
//     )
// }