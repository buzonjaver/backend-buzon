import express from 'express';
import fetch from 'node-fetch';
import nodemailer from 'nodemailer';

const app = express();
const PORT = process.env.PORT || 3000;

const RECAPTCHA_SECRET_KEY = "6LdxGWwrAAAAAO-3qxxIISBNTKMeuU5d8GbO1qC-";

const allowedOrigins = [
    "https://casas-javer.github.io",
    "https://buzonjaver.com"
];

const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: "grupojaver@gmail.com",
        pass: "okjy snbu tcks xavp",
    },
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));


app.use((req, res, next) => {
    const origin = req.headers.origin || req.headers.referer || "";
    if (allowedOrigins.includes(origin)) {
        res.setHeader("Access-Control-Allow-Origin", origin);
    }
    res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");
    if (req.method === "OPTIONS") {
        return res.status(200).end();
    }
    next();
});

app.post('/enviar-correo', async (req, res) => {
    const {
        nombre,
        telefono,
        email,
        desarrollo,
        mensaje,
        aviso,
        "g-recaptcha-response": token,
    } = req.body;

    // Validar campos requeridos
    const requiredFields = { nombre, telefono, email, desarrollo, mensaje, token };
    for (const [key, value] of Object.entries(requiredFields)) {
        if (!value || typeof value !== "string" || value.trim() === "") {
            return res.status(400).json({ message: `El campo "${key}" es obligatorio.` });
        }
    }

    // Validaciones específicas
    if (!/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]{4,}$/.test(nombre)) {
        return res.status(400).json({ message: "Nombre inválido. Usa solo letras y al menos 4 caracteres." });
    }

    if (!/^[0-9]{8,10}$/.test(telefono)) {
        return res.status(400).json({ message: "Teléfono inválido. Debe contener solo números y entre 8 y 10 dígitos." });
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return res.status(400).json({ message: "Correo electrónico inválido." });
    }

    const avisoValido = aviso === true || aviso === "true" || aviso === "on" || aviso === 1;
    if (!avisoValido) {
        return res.status(400).json({ message: "Debes aceptar el aviso de privacidad." });
    }

    // Validar reCAPTCHA con Google
    try {
        const params = new URLSearchParams();
        params.append("secret", RECAPTCHA_SECRET_KEY);
        params.append("response", token);

        const recaptchaRes = await fetch("https://www.google.com/recaptcha/api/siteverify", {
            method: "POST",
            body: params,
        });

        const recaptchaJson = await recaptchaRes.json();

        if (!recaptchaJson.success) {
            return res.status(403).json({ message: "reCAPTCHA inválido" });
        }
    } catch (error) {
        console.error("Error validando reCAPTCHA:", error);
        return res.status(500).json({ message: "Error validando reCAPTCHA" });
    }

    // Enviar correo
    const mailOptions = {
        from: `"${nombre}" <${email}>`,
        to: "reno7882@gmail.com",
        bcc: "rct@javer.com.mx",
        subject: "Nuevo mensaje Sugerencia / recomendación",
        text: `
Nombre: ${nombre}
Teléfono: ${telefono}
Email: ${email}
Desarrollo: ${desarrollo}
Mensaje: ${mensaje}
    `,
    };

    try {
        await transporter.sendMail(mailOptions);
        return res.status(200).json({ message: "Correo enviado correctamente" });
    } catch (error) {
        console.error("Error enviando correo:", error);
        return res.status(500).json({ message: "Error enviando correo" });
    }
});

app.listen(PORT, () => {
    console.log(`Servidor corriendo en puerto ${PORT}`);
});
