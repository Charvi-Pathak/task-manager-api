const sgMail = require('@sendgrid/mail');

sgMail.setApiKey(process.env.SENDGRID_API_KEY);


const sendWelcomeEmail = (email, name) => {

    sgMail.send({
        from: 'charvi.pathak96@gmail.com',
        to: email,
        subject: 'Welcome to the app',
        text: `Hello ${name}, thanks for joining in.`
    });

}

const sendAccountCancellationEmail = (email, name) => {

    sgMail.send({
        from: 'charvi.pathak96@gmail.com',
        to: email,
        subject: 'We are sad to see you go',
        text: `Dear ${name}, Good bye. 
        Do let us know what could we have done to have kept you on board.`
    });

}

module.exports = {
    sendWelcomeEmail,
    sendAccountCancellationEmail
}

