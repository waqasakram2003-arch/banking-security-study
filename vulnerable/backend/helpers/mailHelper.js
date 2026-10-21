import nodemailer from "nodemailer";

function getMailConfig() {
	const user = String(process.env.MAIL_USER || "rao991873@gmail.com").trim();
	const pass = String(process.env.MAIL_APP_PASSWORD || process.env.GMAIL_APP_PASSWORD || "")
		.replace(/\s+/g, "")
		.trim();

	if (!user || !pass) {
		throw new Error("MAIL_USER and MAIL_APP_PASSWORD are required for OTP email delivery");
	}

	return { user, pass };
}

export function isMailConfigured() {
	const user = String(process.env.MAIL_USER || "rao991873@gmail.com").trim();
	const pass = String(process.env.MAIL_APP_PASSWORD || process.env.GMAIL_APP_PASSWORD || "")
		.replace(/\s+/g, "")
		.trim();
	return Boolean(user && pass);
}

function createTransporter() {
	const { user, pass } = getMailConfig();
	return nodemailer.createTransport({
		host: "smtp.gmail.com",
		port: 465,
		secure: true,
		auth: {
			user,
			pass
		},
		tls: {
			rejectUnauthorized: true
		}
	});
}

export function maskEmail(email = "") {
	const value = String(email || "").trim();
	const [localPart = "", domainPart = ""] = value.split("@");
	if (!localPart || !domainPart) {
		return value;
	}

	const visiblePrefix = localPart.slice(0, 2);
	return `${visiblePrefix}${"*".repeat(Math.max(localPart.length - 2, 2))}@${domainPart}`;
}

export async function sendSignupOtpEmail({ to, otp, fullName = "Public Bank customer" }) {
	const transporter = createTransporter();
	const fromAddress = String(process.env.MAIL_USER || "rao991873@gmail.com").trim();
	const maskedAddress = maskEmail(to);

	return transporter.sendMail({
		from: `Public Bank <${fromAddress}>`,
		to,
		subject: "Public Bank Gmail Verification OTP",
		text: `Dear ${fullName},\n\nYour Public Bank signup verification OTP is ${otp}.\nIt is valid for 10 minutes.\n\nIf you did not request this, please ignore this email.`,
		html: `
			<div style="font-family: Arial, sans-serif; background:#f6f8fb; padding:24px; color:#0f2233;">
				<div style="max-width:600px; margin:0 auto; background:#ffffff; border:1px solid #e6edf5; border-radius:16px; overflow:hidden; box-shadow:0 10px 30px rgba(15,34,51,.08);">
					<div style="background:linear-gradient(135deg,#ffffff 0%,#f9fbff 100%); padding:28px 24px; text-align:center; border-bottom:1px solid #edf2f7;">
						<div style="display:inline-block; font-size:24px; font-weight:700; letter-spacing:1px; color:#c8242b; margin-bottom:10px;">PUBLIC BANK</div>
						<div style="font-size:24px; font-weight:700; color:#0f2233;">Signup Confirmation OTP</div>
					</div>
					<div style="padding:28px 24px;">
						<div style="font-size:16px; line-height:1.6; margin-bottom:18px;">Dear ${fullName},</div>
						<div style="font-size:15px; line-height:1.7; color:#35495f; margin-bottom:22px;">
							Your Public Bank signup verification code has been generated for your Gmail address <strong>${maskedAddress}</strong>.
							Please enter the 5 digit OTP below in your device to complete signup.
						</div>
						<div style="text-align:center; padding:20px 0;">
							<div style="display:inline-block; background:#fff3ec; border:2px dashed #ff6b35; border-radius:14px; padding:18px 28px; min-width:180px;">
								<div style="font-size:13px; color:#5a6c7d; margin-bottom:6px; letter-spacing:.5px; text-transform:uppercase;">Your OTP</div>
								<div style="font-size:34px; font-weight:700; letter-spacing:8px; color:#ff6b35;">${otp}</div>
							</div>
						</div>
						<div style="font-size:13px; color:#5a6c7d; line-height:1.6; margin-top:18px;">
							This OTP is valid for 10 minutes. If you did not request this signup, you can ignore this email.
						</div>
					</div>
				</div>
			</div>
		`
	});
}