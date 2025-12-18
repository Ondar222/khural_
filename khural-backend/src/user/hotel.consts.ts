import { MulterField } from "@nestjs/platform-express/multer/interfaces/multer-options.interface";

const CREATE_HOTEL_UPLOADED_FILES: MulterField[] = [
	{ name: "cover", maxCount: 1 },
	{ name: "images", maxCount: 30 },
];

const CITIZEN_DEFAULT_NAME: string = "Мой новый отель";

export {
  CITIZEN_DEFAULT_NAME,
};
