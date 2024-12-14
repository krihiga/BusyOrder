const nodemailer = require('nodemailer');
const multer = require('multer');

const storage = multer.memoryStorage();
const upload = multer({ storage: storage }).array('attachments');

const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_PASS,
    },
    logger: true, // Log SMTP communication
    debug: true,  // Show detailed debug information
});

module.exports = (req, res) => {
    if (req.method === 'POST') {
        upload(req, res, async (err) => {
            if (err) {
                console.error('Error uploading file:', err);
                return res.status(400).json({ error: 'Error uploading file' });
            }

            const { email, name, phone, businessName, style, colors, message } = req.body;

            if (!email || !name || !message) {
                return res.status(400).json({ error: 'Missing required fields' });
            }

            const mailOptions = {
                from: process.env.GMAIL_USER,
                replyTo: email,
                to: process.env.GMAIL_USER,
                subject: `New Design Order from ${name}`,
                text: `
                    Name: ${name}
                    Email: ${email}
                    Phone: ${phone || 'N/A'}
                    Business Name: ${businessName || 'N/A'}
                    Preferred Style: ${style || 'N/A'}
                    Preferred Colors: ${colors || 'N/A'}
                    Message: ${message}`,
                attachments: [],
            };

            if (req.files && req.files.length > 0) {
                req.files.forEach(file => {
                    mailOptions.attachments.push({
                        filename: file.originalname,
                        content: file.buffer,
                    });
                });
            }

            try {
                const info = await transporter.sendMail(mailOptions);
                console.log('Email sent successfully:', info);
                res.status(200).json({ message: 'Email sent successfully!' });
            } catch (error) {
                console.error('Error sending email:', error);
                res.status(500).json({ error: `Error sending email: ${error.message}` });
            }
        });
    } else {
        res.status(405).json({ error: 'Method Not Allowed' });
    }
};
