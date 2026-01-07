import mongoose from "mongoose";

// Establece la conexión con MongoDB usando Mongoose.
export async function connectDatabase(uri: string): Promise<void> {
  await mongoose.connect(uri);
}
