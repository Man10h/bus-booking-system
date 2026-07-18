package com.Man10h.notification_service.service.impl;

import com.Man10h.notification_service.service.MailService;
import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
@Slf4j
public class MailServiceImpl implements MailService {

    private final JavaMailSender mailSender;

    @Override
    public void sendMail(String to, String subject, String content) {
        try{
            MimeMessage mimeMessage = mailSender.createMimeMessage();
            MimeMessageHelper mimeMessageHelper = new MimeMessageHelper(mimeMessage, true);

            mimeMessageHelper.setTo(to);
            mimeMessageHelper.setSubject(subject);
            mimeMessageHelper.setText(content, true);
            mailSender.send(mimeMessage);
        } catch (Exception e) {
            log.error(e.getMessage());
            throw new RuntimeException(e.getMessage());
        }
    }

    @Override
    public String buildEmailTemplate(String title, String message) {
        return String.format("""
        <!DOCTYPE html>
        <html lang="vi">
        <head>
            <meta charset="UTF-8">
            <style>
                body{
                    margin:0;
                    padding:0;
                    background:#f4f6f9;
                    font-family:Arial,Helvetica,sans-serif;
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
                    font-size:24px;
                    font-weight:bold;
                }

                .content{
                    padding:32px;
                    color:#374151;
                    line-height:1.7;
                    font-size:16px;
                }

                .message{
                    margin:24px 0;
                    padding:18px;
                    background:#eff6ff;
                    border-left:5px solid #2563eb;
                    border-radius:8px;
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

                .footer{
                    text-align:center;
                    padding:20px;
                    background:#f9fafb;
                    color:#9ca3af;
                    font-size:13px;
                }
            </style>
        </head>
        <body>

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
                        Nếu bạn có bất kỳ câu hỏi nào, vui lòng liên hệ với chúng tôi.
                    </p>
                </div>

                <div class="footer">
                    © 2026 Bus Booking System<br>
                    Email này được gửi tự động, vui lòng không trả lời.
                </div>

            </div>
        </div>

        </body>
        </html>
        """, title, message);
    }
}
