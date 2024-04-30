const express = require('express');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const MsgReader = require('msgreader').default;
const { simpleParser } = require('mailparser');
const { generatePdf } = require('html-pdf-node');

const app = express();
const upload = multer({ dest: 'uploads/' });

app.post('/upload', upload.single('file'), async (req, res) => {
    const filePath = req.file.path;
    const fileBuffer = fs.readFileSync(filePath);

    try {
        let htmlContent;
        if (path.extname(req.file.originalname).toLowerCase() === '.msg') {
            const msgReader = new MsgReader(fileBuffer);
            const msgData = msgReader.getFileData();
            htmlContent = msgData.htmlBody || "<p>No message body</p>"; // Using HTML content
        } else if (path.extname(req.file.originalname).toLowerCase() === '.eml') {
            const mail = await simpleParser(fileBuffer);
            htmlContent = mail.html || "<p>No message body</p>"; // Directly using HTML
        } else {
            fs.unlinkSync(filePath);
            return res.status(400).send("Unsupported file format");
        }

        const pdfPath = path.join(__dirname, 'output', `${Date.now()}.pdf`);
        const options = { format: 'A4' };
        const file = { content: htmlContent };

        // Generate PDF from HTML
        generatePdf(file, options).then(pdfBuffer => {
            fs.writeFileSync(pdfPath, pdfBuffer);
            fs.unlinkSync(filePath); // Clean up uploaded file
            res.send({ message: 'File converted to PDF', pdfPath });
        });
    } catch (error) {
        console.error(error);
        res.status(500).send('Error processing your file');
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
