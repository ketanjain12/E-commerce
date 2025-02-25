
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
	plugins: [react()],
	server: {
		proxy: {
			"/api": {
				target: "http://localhost:5000", // Backend ka sahi port
				changeOrigin: true, // CORS issue solve karega
				secure: false, // HTTPS issue solve karega agar ho
				rewrite: (path) => path.replace(/^\/api/, ""), // API requests ko sahi redirect karega
			},
		},
	},
});

