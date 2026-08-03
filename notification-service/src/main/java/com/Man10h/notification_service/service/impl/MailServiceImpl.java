package com.Man10h.notification_service.service.impl;

import com.Man10h.notification_service.service.MailService;
import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
@Slf4j
public class MailServiceImpl implements MailService {

    private final JavaMailSender mailSender;

    @Value("${spring.mail.username}")
    private String fromAddress;

    private static final String FROM_NAME = "Bus Booking System";

    @Override
    public void sendMail(String to, String subject, String content) {
        try {
            MimeMessage mimeMessage = mailSender.createMimeMessage();
            // "true" = multipart -> cho phép gửi kèm bản text thuần
            MimeMessageHelper helper = new MimeMessageHelper(
                    mimeMessage,
                    MimeMessageHelper.MULTIPART_MODE_MIXED_RELATED,
                    "UTF-8"
            );

            helper.setFrom(fromAddress, FROM_NAME);
            helper.setTo(to);
            helper.setSubject(subject);

            // Phần text thuần giúp giảm khả năng bị đánh giá là spam
            String plainText = buildPlainTextFallback(subject, content);
            helper.setText(plainText, content); // (plainText, htmlText)

            mailSender.send(mimeMessage);
        } catch (Exception e) {
            log.error("Send mail failed: {}", e.getMessage());
            throw new RuntimeException(e.getMessage());
        }
    }

    /**
     * Tạo bản text thuần đơn giản từ nội dung HTML (fallback cho client
     * không hỗ trợ HTML, đồng thời tăng độ tin cậy chống spam).
     */
    private String buildPlainTextFallback(String title, String htmlMessage) {
        String stripped = htmlMessage
                .replaceAll("<[^>]*>", " ")
                .replaceAll("\\s+", " ")
                .trim();

        return """
                %s

                %s

                --
                Bus Booking System
                Email này được gửi tự động, vui lòng không trả lời.
                """.formatted(title, stripped);
    }

    @Override
    public String buildEmailTemplate(String title, String message) {
        return String.format("""
        <!DOCTYPE html>
        <html lang="vi">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <meta http-equiv="X-UA-Compatible" content="IE=edge">
            <title>%s</title>
            <style>
                body{
                    margin:0;
                    padding:0;
                    background:#f4f6f9;
                    font-family:Arial,Helvetica,sans-serif;
                    -webkit-text-size-adjust:100%%;
                }

                .preheader{
                    display:none;
                    max-height:0;
                    overflow:hidden;
                    mso-hide:all;
                }

                .container{
                    width:100%%;
                    padding:40px 0;
                }

                .card{
                    max-width:600px;
                    margin:auto;
                    background:#ffffff;
                    border-radius:12px;
                    overflow:hidden;
                    box-shadow:0 4px 12px rgba(0,0,0,.1);
                }

                .header{
                    background:#2563eb;
                    color:#ffffff;
                    text-align:center;
                    padding:24px;
                    font-size:22px;
                    font-weight:bold;
                }

                .content{
                    padding:32px;
                    color:#374151;
                    line-height:1.7;
                    font-size:16px;
                }

                .content h2{
                    margin-top:0;
                    color:#111827;
                    font-size:18px;
                }

                .message{
                    margin:24px 0;
                    padding:18px;
                    background:#eff6ff;
                    border-left:5px solid #2563eb;
                    border-radius:8px;
                    word-break:break-word;
                }

                .button{
                    display:inline-block;
                    margin-top:20px;
                    padding:12px 28px;
                    background:#2563eb;
                    color:#ffffff !important;
                    text-decoration:none;
                    border-radius:8px;
                    font-weight:bold;
                }

                .divider{
                    border:none;
                    border-top:1px solid #e5e7eb;
                    margin:24px 0;
                }

                .footer{
                    text-align:center;
                    padding:24px;
                    background:#f9fafb;
                    color:#9ca3af;
                    font-size:12px;
                    line-height:1.6;
                }

                .footer a{
                    color:#6b7280;
                    text-decoration:underline;
                }
            </style>
        </head>
        <body>

        <!-- Preheader: dòng preview hiển thị trong inbox, giúp tăng tỷ lệ mở & giảm nghi ngờ spam -->
        <div class="preheader">%s</div>

        <div class="container">
            <div class="card">

                <div class="header">
                    🚌 Bus Booking System
                </div>

                <div class="content">

                    <h2>%s</h2>

                    <p>Xin chào,</p>

                    <div class="message">
                        %s
                    </div>

                    <p>
                        Nếu bạn có bất kỳ câu hỏi nào, vui lòng liên hệ với chúng tôi qua email hỗ trợ
                        <a href="mailto:support@busbooking.com">support@busbooking.com</a>.
                    </p>

                    <hr class="divider">

                    <p style="font-size:13px;color:#9ca3af;">
                        Đây là email tự động từ hệ thống, vui lòng không trả lời trực tiếp email này.
                    </p>
                </div>

                <div class="footer">
                    © 2026 Bus Booking System. Mọi quyền được bảo lưu.<br>
                    Địa chỉ: 123 Đường ABC, Quận 1, TP. Hồ Chí Minh, Việt Nam<br>
                    Bạn nhận được email này vì có tài khoản trên hệ thống Bus Booking System.<br>
                    <a href="{{unsubscribeLink}}">Hủy nhận email thông báo</a>
                </div>

            </div>
        </div>

        </body>
        </html>
        """, title, title, title, message);
    }
}