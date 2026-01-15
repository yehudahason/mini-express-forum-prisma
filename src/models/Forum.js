import { DataTypes, Model } from "sequelize";
import { sequelize } from "./index.js";

export class Forum extends Model {}

Forum.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    slug: {
      type: DataTypes.STRING,
      unique: true,
    },
    description: {
      type: DataTypes.TEXT,
    },
  },
  {
    sequelize,
    modelName: "Forum",
    tableName: "forums",
    timestamps: false,
  }
);
