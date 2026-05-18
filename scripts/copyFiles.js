//const fs = require("fs-extra");
//const path = require("path");

import fs from "fs-extra";
import path from "path";

async function copyFiles(destinationFolderName) {
  try {
    await fs.copy("public", ".next/standalone/public");
    await fs.copy(".env", ".next/standalone/.env");
    await fs.copy(".next/static", ".next/standalone/.next/static");
    await fs.remove(".next/standalone/node_modules/.cache");
    console.log("✅ Đã copy thư mục public & .next/static vào standalone");
    console.log("✅ Đã copy file .env vào standalone");
    console.log("✅ Đã xóa thư mục .cache trong node_modules");

    // Tạo thư mục release nếu chưa tồn tại
    const releaseDir = path.join(process.cwd(), "release");
    await fs.ensureDir(releaseDir);

    // Copy thư mục .next/standalone vào thư mục release với tên được truyền vào
    const destinationPath = path.join(releaseDir, destinationFolderName);
    await fs.copy(".next/standalone", destinationPath);
    console.log(`✅ Đã copy thư mục .next/standalone vào ${destinationPath}`);
  } catch (err) {
    console.error("❌ Lỗi khi copy file:", err);
    process.exit(1);
  }
}

// Lấy tên thư mục đích từ tham số dòng lệnh
const destinationFolderName = process.argv[2]; // Tham số thứ 2 từ terminal

if (!destinationFolderName) {
  console.error("❌ Vui lòng truyền tên thư mục đích từ terminal.");
  process.exit(1);
}

copyFiles(destinationFolderName);
