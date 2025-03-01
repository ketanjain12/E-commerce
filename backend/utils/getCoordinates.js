import axios from "axios";

// const getCoordinates = async (address) => {
//     try {
//         const response = await axios.get(`https://nominatim.openstreetmap.org/search`, {
//             params: {
//                 q: address,
//                 format: "json",
//                 limit: 1
//             },
//             headers: {
//                 "User-Agent": "MyApp"
//             }
//         });

//         if (response.data.length === 0) {
//             return { latitude: null, longitude: null };
//         }

//         const { lat, lon } = response.data[0];
//         return { latitude: parseFloat(lat), longitude: parseFloat(lon) };
//     } catch (error) {
//         console.error("Error fetching coordinates:", error.message);
//         return { latitude: null, longitude: null };
//     }
// };

// export default getCoordinates;
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const getCoordinates = async (address) => {
    try {
        await sleep(1000); // 1 second delay
        const response = await axios.get("https://nominatim.openstreetmap.org/search", {
            params: { q: address, format: "json", limit: 1 }
        });

        console.log("API Response:", response.data);

        if (response.data.length === 0) {
            console.error("No results found");
            return { latitude: null, longitude: null };
        }

        return { latitude: parseFloat(response.data[0].lat), longitude: parseFloat(response.data[0].lon) };

    } catch (error) {
        console.error("Error fetching coordinates:", error);
        return { latitude: null, longitude: null };
    }
};
export default getCoordinates;