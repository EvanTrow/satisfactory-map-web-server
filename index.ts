import express from 'express';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import winston from 'winston';

dotenv.config();

const app = express();
const port = 3000;
const savePath = process.env.SAVE_PATH;

const logger = winston.createLogger({
	level: 'info',
	format: winston.format.combine(
		winston.format.timestamp({ format: 'YYYY-MM-DD hh:mm:ss A' }),
		winston.format.printf(({ timestamp, level, message }) => `${timestamp} [${level}]: ${message}`),
	),
	transports: [new winston.transports.Console()],
});

app.get('/', (req, res) => {
	const search = (req.query.search as string)?.toLocaleLowerCase();

	// Get all files in the saves directory that match the search
	const foundFiles = fs.readdirSync(savePath).filter((file) => file.toLocaleLowerCase().includes(search));

	if (foundFiles.length === 0) {
		return res.status(404).send('No matching files found.');
	}

	// Get file stats for each found file and sort by modification time
	const fileWithStats = foundFiles
		.map((file) => {
			const filePath = path.join(savePath, file);
			const stats = fs.statSync(filePath);
			return { file, mtime: stats.mtime };
		})
		.sort((a, b) => b.mtime.getTime() - a.mtime.getTime());

	// get the last edited file and its path
	const lastEditedFile = fileWithStats[0].file;
	const lastEditedFilePath = path.join(savePath, lastEditedFile);

	// Send the last edited file
	logger.info(`Sending file: ${lastEditedFilePath}`);
	return res.sendFile(path.resolve(lastEditedFilePath));
});

app.listen(port, () => {
	return console.log(`Express is listening at http://localhost:${port}`);
});
