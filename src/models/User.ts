import { Schema, model, Document } from "mongoose";

// Documento de usuario para autenticación básica.
export interface UserDocument extends Document {
  email: string;
  password: string;
  createdAt: Date;
}

// Esquema con email único y password hasheado.
const UserSchema = new Schema<UserDocument>(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true },
    createdAt: { type: Date, default: Date.now }
  },
  { versionKey: false }
);

export const UserModel = model<UserDocument>("User", UserSchema);
