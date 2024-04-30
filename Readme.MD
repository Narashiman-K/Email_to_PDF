Steps:

To convert .msg (Outlook email files) and .eml (email files) to PDF in a Node.js environment, you will need to handle both file types appropriately  while maintaining images and links embedded in the emails involves additional complexity. Since they have different formats and handling mechanisms. .msg is a proprietary binary format used by Microsoft Outlook, while .eml files are plain text that follow the MIME standard.
The pdfkit library, which we are using, supports adding images and hyperlinks but does not automatically handle HTML content. You will need to manually parse the HTML and appropriately format it into the PDF.

For this task, we'll use Node.js with several libraries:
    * msgreader for .msg files to extract their content.
    * mailparser for parsing .eml files.
    * pdfkit for generating PDF files.
    * multer, express, html-pdf-node and cheerio

Commands:
	mkdir emailToPdfConverter
	cd emailToPdfConverter
	
	npm init -y
	npm install express multer msgreader mailparser pdfkit
	npm install html-pdf-node cheerio

	mkdir output
	node server.js

You can now test your server using Postman or cURL by uploading .msg or .eml files to the /upload endpoint. Ensure that your requests are configured to send the file as multipart/form-data.

If you want to test using the postman:
1. Open Postman and create a new request by clicking on the "New" button or the "+" tab.
2. Set up the request:
    Method: Select POST as the method from the dropdown menu.
    Request URL: Enter the URL for your upload endpoint, e.g., http://localhost:3000/upload.
3. Go to the 'Body' tab: In your new POST request, navigate to the 'Body' tab underneath the URL.
4. Select 'form-data': In the body of the request, select the 'form-data' option.
5. Set up the file data:
    * Key: Type file in the key field (this should match the key expected by your server-side code in upload.single('file')).
    * Select Type: Change the type from "Text" to "File" using the dropdown menu on the right side of the key field.
    * Upload File: Click on the 'Select Files' button that appears in the value field after you change the type to 'File', and choose the .msg file you want to upload from your file system.
6. Click 'Send': After setting up the file in the request, click the 'Send' button.
7. View the response: The response from your server will be displayed in the lower section of the Postman interface. If everything is set up correctly, your server should return a success message and the path to the converted PDF.
8. You should be able to see the converted PDF file in the output folder of your project.  

server.js
~~~~~~~~~
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

