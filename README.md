# Marx Wiström - Backend Web Developer Portfolio

A modern, responsive portfolio website showcasing backend web development projects and skills. Built with vanilla HTML, CSS, and JavaScript, featuring professional design, interactive elements, and integrated contact functionality.

## 🎯 Project Overview

This portfolio website serves as a professional showcase for Marx Wiström's backend development expertise during his educational journey. The site demonstrates modern web development practices, clean code architecture, and user-centered design principles.

**Live Demo:** [Portfolio Website](https://marxwistrom.github.io/marxport/index.html)

## ✨ Features

### 🎨 Design & User Experience
- **Responsive Design**: Mobile-first approach with seamless desktop scaling
- **Dark Purple Theme**: Professional color scheme with modern aesthetics
- **Smooth Animations**: CSS transitions and JavaScript-powered scroll effects
- **Interactive Elements**: Hover effects, loading states, and visual feedback
- **Accessibility**: Semantic HTML and keyboard navigation support

### 🚀 Functionality
- **Project Portfolio**: Filterable showcase of 12 backend development projects
- **Contact Form**: Integrated email functionality using EmailJS
- **Real-time Validation**: Client-side form validation with user feedback
- **Notification System**: Toast notifications for user actions
- **Statistics Counter**: Animated project and technology counters
- **Mobile Navigation**: Hamburger menu with smooth animations

### 🛠 Technical Implementation
- **Vanilla JavaScript**: Modern ES6+ features and best practices
- **CSS Grid & Flexbox**: Advanced layout techniques
- **Intersection Observer**: Performance-optimized scroll animations
- **EmailJS Integration**: Client-side email sending without backend
- **Progressive Enhancement**: Works without JavaScript enabled

## 📁 Project Structure

```
Marx Main Space/
├── index.html                 # Main HTML file
├── README.md                 # Project documentation
├── src/
│   ├── css/
│   │   └── styles.css        # Main stylesheet with all styling
│   ├── js/
│   │   └── script.js         # JavaScript functionality (educational version)
│   ├── MARX-GIT.png         # Profile image
│   └── backiee-316910.jpg    # Background image
└── .vscode/
    └── settings.json         # VS Code configuration
```

## 🚀 Getting Started

### Prerequisites
- Modern web browser (Chrome, Firefox, Safari, Edge)
- Text editor or IDE for modifications
- EmailJS account (for contact form functionality)

### Installation

1. **Clone or download the project**
   ```bash
   git clone https://github.com/marxwistrom/grit-coding.git
   cd grit-coding
   ```

2. **Open in browser**
   ```bash
   # Simply open index.html in your browser
   open index.html
   # or
   python -m http.server 8000  # For local development server
   ```

3. **Configure EmailJS (Optional)**
   - Sign up at [EmailJS.com](https://www.emailjs.com/)
   - Create email service and template
   - Update credentials in `src/js/script.js`:
     ```javascript
     emailjs.init('YOUR_PUBLIC_KEY');
     emailjs.send('YOUR_SERVICE_ID', 'YOUR_TEMPLATE_ID', templateParams)
     ```

## 📧 Email Configuration

The contact form uses EmailJS for client-side email sending. To activate:

### 1. EmailJS Setup
- Create account at [emailjs.com](https://www.emailjs.com/)
- Add email service (Gmail recommended)
- Create email template with variables:
  - `{{from_name}}` - Sender's name
  - `{{from_email}}` - Sender's email
  - `{{message}}` - Message content
  - `{{reply_to}}` - Reply address



### 3. Email Template Example
```
Subject: Portfolio Contact - {{from_name}}

From: {{from_name}}
Email: {{from_email}}

Message:
{{message}}

---
Sent from Marx Wiström's Portfolio Website
Reply to: {{reply_to}}
```

## 🎨 Customization

### Adding New Projects
Edit the `projects` array in `src/js/script.js`:
```javascript
{
    id: 13,
    title: "Your Project Name",
    description: "Detailed project description...",
    technologies: ["Tech1", "Tech2", "Tech3"],
    category: "api", // or "fullstack", "microservices", "database"
    icon: "fas fa-icon-name",
    github: "https://github.com/username/repo",
    demo: "https://your-demo-url.com" // or null
}
```

### Current Projects Include:
- **E-Commerce REST API** - Node.js/Express backend with MongoDB
- **Task Management System** - Django full-stack with PostgreSQL
- **Authentication Microservice** - Spring Boot with OAuth2
- **Inventory Database System** - PostgreSQL with performance optimization
- **Blog Content API** - Laravel with Elasticsearch
- **Real-time Chat Backend** - Node.js with Socket.io
- **Payment Processing Service** - .NET Core with Azure integration
- **Analytics Data Backend** - FastAPI with ClickHouse
- **Quantum Profile Hub** - Interactive portfolio website
- **Quantum Warehouse** - Warehouse management system
- **Visualisations of Universal Space** - Space visualization app
- **XYZ - Universal Grid Visualisation** - Advanced grid visualization system

### Modifying Styles
Key CSS variables in `src/css/styles.css`:
```css
:root {
    --primary-color: #7c3aed;      /* Purple accent */
    --background-dark: #1e1b4b;    /* Dark purple background */
    --text-light: #f8fafc;        /* Light text */
    --card-background: #312e81;    /* Card backgrounds */
}
```

### Updating Content
- **Personal Info**: Edit HTML content in `index.html`
- **Profile Image**: Replace `src/MARX-GIT.png`
- **Background**: Replace `src/backiee-316910.jpg`
- **Contact Email**: Update in JavaScript and EmailJS template

## 🛠 Technologies Used

### Frontend
- **HTML5**: Semantic markup and accessibility
- **CSS3**: Grid, Flexbox, animations, custom properties
- **JavaScript (ES6+)**: Modern syntax and APIs

### Libraries & Services
- **Font Awesome**: Icons and visual elements
- **Google Fonts**: Inter font family
- **EmailJS**: Client-side email functionality

### APIs & Features
- **Intersection Observer**: Scroll animations
- **FormData API**: Form handling
- **CSS Grid & Flexbox**: Layout systems
- **CSS Custom Properties**: Theming system

## 📱 Browser Support

- ✅ Chrome 60+
- ✅ Firefox 55+
- ✅ Safari 12+
- ✅ Edge 79+
- ✅ Mobile browsers (iOS Safari, Chrome Mobile)

## 🎓 Educational Value

This project demonstrates:

### JavaScript Concepts
- **Modern ES6+ Syntax**: Arrow functions, template literals, destructuring
- **DOM Manipulation**: querySelector, classList, event handling
- **Asynchronous Programming**: Promises, async/await patterns
- **Functional Programming**: Array methods, higher-order functions
- **Performance Optimization**: Debouncing, Intersection Observer

### Web Development Practices
- **Responsive Design**: Mobile-first CSS methodology
- **Progressive Enhancement**: Graceful degradation
- **Accessibility**: Semantic HTML, keyboard navigation
- **Code Organization**: Modular structure, clear documentation
- **Version Control**: Git workflow and documentation

### Backend Integration Concepts
- **API Integration**: EmailJS service integration
- **Form Validation**: Client and server-side considerations
- **Error Handling**: User feedback and graceful failures
- **Security Awareness**: Input validation, XSS prevention

## 📈 Performance Features

- **Optimized Images**: Compressed assets for fast loading
- **Minimal Dependencies**: Vanilla JavaScript for performance
- **Lazy Loading**: Intersection Observer for animations
- **Debounced Events**: Optimized scroll and resize handlers
- **CSS Animations**: Hardware-accelerated transitions

## 🔧 Development

### Local Development
```bash
# Start local server
python -m http.server 8000
# or
npx serve .
# or
php -S localhost:8000
```

### Code Quality
- **ESLint**: JavaScript linting (configuration available)
- **Prettier**: Code formatting
- **Semantic HTML**: Proper element usage
- **CSS Organization**: Logical structure and comments

## 📝 License

MIT - Marx Wiström - This project is open source and available under the [MIT License]

## 👤 Author

**Marx Wiström**
- Email: marxwistrom@gmail.com
- GitHub: [@marxwistrom](https://github.com/marxwistrom)
- LinkedIn: [Marx Wiström](https://linkedin.com/in/marxwistrom179)

## 🤝 Contributing

While this is a personal portfolio, suggestions and improvements are welcome:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/improvement`)
3. Commit changes (`git commit -am 'Add improvement'`)
4. Push to branch (`git push origin feature/improvement`)
5. Open a Pull Request

## 📞 Contact

For questions about this project or collaboration opportunities:

- **Email**: marxwistrom@gmail.com
- **Portfolio**: [Live Website](https://marxwistrom.github.io/marx-edu/index.html)
- **GitHub**: [Project Repository](https://github.com/marxwistrom/marx-edu/)

---

*Built with ❤️ for showcasing backend web development skills*


