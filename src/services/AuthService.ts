import bcrypt from "bcryptjs";
import jwt, { Secret, SignOptions } from "jsonwebtoken";
import { Model } from "mongoose";
import { AuthPayload } from "../types/tipos";
import { UserDocument } from "../models/User";

// Servicio de autenticación: registro, login y verificación de JWT.
export class AuthService {
  constructor(private readonly userModel: Model<UserDocument>, private readonly jwtSecret: string, private readonly jwtExpiresIn: SignOptions["expiresIn"] = "1h") {}

  async register(email: string, password: string): Promise<AuthPayload> {
    const hashed = await bcrypt.hash(password, 10);
    const user = await this.userModel.create({ email, password: hashed });
    return { userId: user.id, email: user.email };
  }

  async login(email: string, password: string): Promise<string> {
    const user = await this.userModel.findOne({ email }).exec();
    if (!user) {
      throw new Error("Invalid credentials");
    }
    const matches = await bcrypt.compare(password, user.password);
    if (!matches) {
      throw new Error("Invalid credentials");
    }
    return this.signToken({ userId: user.id, email: user.email });
  }

  verifyToken(token: string): AuthPayload {
    const decoded = jwt.verify(token, this.jwtSecret) as AuthPayload;
    return decoded;
  }

  private signToken(payload: AuthPayload): string {
    return jwt.sign(payload, this.jwtSecret as Secret, { expiresIn: this.jwtExpiresIn });
  }
}
