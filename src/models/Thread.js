import { DataTypes, Model } from "sequelize";
import { sequelize } from "./index.js";

export class Thread extends Model {}

Thread.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    forum_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    author: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    content: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
    reply_count: {
      type: DataTypes.VIRTUAL,
      get() {
        return this.getDataValue("reply_count");
      },
    },
  },
  {
    sequelize,
    modelName: "Thread",
    tableName: "threads",
    timestamps: false,
  }
);
