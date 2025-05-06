// Email handling functionality
document.addEventListener('DOMContentLoaded', function() {
    // Initialize EmailJS with the public key
    emailjs.init("j2hXIX9LeNTCc2nEV");
    
    const contactForm = document.getElementById('contactForm');
    if (contactForm) {
        contactForm.addEventListener('submit', function(e) {
            e.preventDefault();

            const templateParams = {
                to_email: 'diplant.info@gmail.com',
                from_email: this.email.value,
                message: this.message.value
            };

            // Send email using the correct service ID and template ID
            emailjs.send('service_b68v0x7', 'template_contact', templateParams)
                .then(function(response) {
                    console.log('Email sent successfully:', response);
                    showNotification('Üzenet sikeresen elküldve!', 'success');
                    contactForm.reset();
                }, function(error) {
                    console.error('EmailJS error:', error);
                    showNotification('Hiba történt az üzenet küldése során. Kérjük, próbálja újra később.', 'error');
                });
        });
    }
});

// Show notification function if not already defined
if (typeof showNotification !== 'function') {
    function showNotification(message, type = 'success') {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.remove();
        }, 3000);
    }
}