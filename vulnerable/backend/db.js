import mongoose from "mongoose";
import dns from "node:dns";

export async function connectDB(uri = process.env.MONGODB_URI) {
	if (!uri) {
		throw new Error("MONGODB_URI is missing in .env");
	}

	try {
		await mongoose.connect(uri);
		console.log("MongoDB connected");
	} catch (error) {
		const isSrvDnsRefused =
			error?.code === "ECONNREFUSED" && error?.syscall === "querySrv";

		if (uri.startsWith("mongodb+srv://") && isSrvDnsRefused) {
			// console.warn("DNS SRV query refused by local resolver. Retrying with public DNS...");
			dns.setServers(["8.8.8.8", "1.1.1.1"]);
			await mongoose.connect(uri);
			console.log("MongoDB connected");
			return;
		}

		console.error("MongoDB connection failed:", error.message);
		throw error;
	}
}

export default connectDB;


