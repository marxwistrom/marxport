/**
 * Project Rendering Function - Dynamic Content Generation
 * 
 * Demonstrates:
 * - Array filtering with filter() method
 * - Conditional (ternary) operator
 * - Dynamic DOM element creation
 * - Staggered animations with setTimeout()
 * 
 * @param {string} category - Filter category ('all', 'api', 'fullstack', etc.)
 */
function renderProjects(category) {
    // Filter projects based on category using modern array methods
    // Ternary operator provides concise conditional logic
    const filteredProjects = category === 'all' 
        ? projects  // Show all projects if 'all' is selected
        : projects.filter(project => project.category === category);  // Filter by category
    
    // Clear existing content before rendering new projects
    // innerHTML = '' is efficient for clearing container content
    projectsGrid.innerHTML = '';
    
    // Render each filtered project with staggered animation
    // forEach() with index parameter for animation timing
    filteredProjects.forEach((project, index) => {
        // Create DOM element for each project
        const projectCard = createProjectCard(project);
        
        // Add to DOM immediately (invisible due to CSS)
        projectsGrid.appendChild(projectCard);
        
        // Staggered animation: each card appears 100ms after the previous
        // setTimeout() creates non-blocking delays for smooth animation
        setTimeout(() => {
            projectCard.classList.add('visible');  // Triggers CSS animation
        }, index * 100);  // Multiply by index for staggered effect
    });
}

/**
 * Project Card Creation - Template Generation
 * 
 * Demonstrates:
 * - Template literals (backticks) for HTML generation
 * - Array.map() for data transformation
 * - Conditional rendering with ternary operators
 * - String interpolation with ${} syntax
 * 
 * @param {Object} project - Project data object
 * @returns {HTMLElement} - Complete project card DOM element
 */
function createProjectCard(project) {
    // Create container element using modern DOM API
    const card = document.createElement('div');
    card.className = 'project-card fade-in';  // CSS classes for styling and animation
    card.dataset.category = project.category;  // Data attribute for potential filtering
    
    // Conditional demo link generation
    // Only create demo link if demo URL exists (not null)
    const demoLink = project.demo 
        ? `<a href="${project.demo}" class="project-link" target="_blank">
             <i class="fas fa-external-link-alt"></i> Live Demo
           </a>`
        : '';  // Empty string if no demo available
    
    // Conditional documentation link generation
    const documentationLink = project.documentation 
        ? `<a href="${project.documentation}" class="project-link" target="_blank">
             <i class="fas fa-book"></i> Documentation
           </a>`
        : '';  // Empty string if no documentation available
    
    // Conditional GitHub link generation
    const githubLink = project.github 
        ? `<a href="${project.github}" class="project-link" target="_blank">
             <i class="fab fa-github"></i> View Code
           </a>`
        : '';  // Empty string if no GitHub link available
    
    // Template literal for HTML generation
    // Allows multi-line strings and variable interpolation
    card.innerHTML = `
        <div class="project-icon">
            <i class="${project.icon}"></i>
        </div>
        <div class="project-content">
            <h3 class="project-title">${project.title}</h3>
            <p class="project-description">${project.description}</p>
            <div class="project-tech">
                ${project.technologies.map(tech => `<span class="tech-tag">${tech}</span>`).join('')}
            </div>
            <div class="project-links">
                ${githubLink}
                ${demoLink}
                ${documentationLink}
            </div>
        </div>
    `;
    
    return card;  // Return completed DOM element
}

/**
 * Projects Array - Contains all portfolio projects
 */
const projects = [
    {
        id: 1,
        title: "E-Commerce REST API",
        description: "Comprehensive backend API for e-commerce platform with user authentication, product management, order processing, and payment integration. Built with Node.js and Express.",
        technologies: ["Node.js", "Express", "MongoDB", "JWT", "Stripe API"],
        category: "api",
        icon: "fas fa-shopping-cart",
        documentation: "projectcode/index.html#ecommerce-api"
    },
    {
        id: 2,
        title: "Task Management System",
        description: "Full-stack task management application with real-time updates, user roles, project collaboration, and deadline tracking. Features RESTful API design.",
        technologies: ["Python", "Django", "PostgreSQL", "Redis", "WebSocket"],
        category: "fullstack",
        icon: "fas fa-tasks",
        documentation: "projectcode/index.html#task-management"
    },
    {
        id: 3,
        title: "Authentication Microservice",
        description: "Scalable authentication service with JWT tokens, OAuth integration, role-based access control, and session management for distributed systems.",
        technologies: ["Java", "Spring Boot", "MySQL", "OAuth2", "Docker"],
        category: "microservices",
        icon: "fas fa-shield-alt",
        documentation: "projectcode/index.html#authentication-microservice"
    },
    {
        id: 4,
        title: "Inventory Database System",
        description: "Advanced database design for inventory management with complex queries, stored procedures, triggers, and performance optimization for large datasets.",
        technologies: ["PostgreSQL", "SQL", "PL/pgSQL", "Indexing", "Performance Tuning"],
        category: "database",
        icon: "fas fa-database",
        documentation: "projectcode/index.html#inventory-database"
    },
    {
        id: 5,
        title: "Blog Content API",
        description: "RESTful API for blog platform with content management, user authentication, commenting system, and search functionality. Includes admin dashboard.",
        technologies: ["PHP", "Laravel", "MySQL", "Elasticsearch", "Redis"],
        category: "api",
        icon: "fas fa-blog",
        documentation: "projectcode/index.html#blog-content-api"
    },
    {
        id: 6,
        title: "Real-time Chat Backend",
        description: "Scalable chat application backend with WebSocket connections, message persistence, user presence tracking, and room-based messaging.",
        technologies: ["Node.js", "Socket.io", "MongoDB", "Express", "JWT"],
        category: "fullstack",
        icon: "fas fa-comments",
        documentation: "projectcode/index.html#chat-backend"
    },
    {
        id: 7,
        title: "Payment Processing Service",
        description: "Secure microservice for payment processing with multiple gateway integration, transaction logging, fraud detection, and PCI compliance.",
        technologies: ["C#", ".NET Core", "SQL Server", "Azure", "Stripe"],
        category: "microservices",
        icon: "fas fa-credit-card",
        documentation: "projectcode/index.html#payment-processing"
    },
    {
        id: 8,
        title: "Analytics Data Backend",
        description: "High-performance backend for analytics dashboard with data aggregation, real-time metrics, custom reporting, and data visualization support.",
        technologies: ["Python", "FastAPI", "ClickHouse", "Apache Kafka", "Docker"],
        category: "database",
        icon: "fas fa-chart-bar",
        documentation: "projectcode/index.html#analytics-backend"
    },
    {
        id: 9,
        title: "Quantum Profile Hub",
        description: "Interactive portfolio website showcasing modern web development with quantum-themed animations, responsive design, and dynamic content management. Features advanced CSS animations and JavaScript interactivity.",
        technologies: ["HTML5", "CSS3", "JavaScript", "Responsive Design", "Animations"],
        category: "fullstack",
        icon: "fas fa-atom",
        github: "https://github.com/marxwistrom/grit-coding",
        demo: "https://marxwistrom.github.io/grit-coding/index.html"
    },
    {
        id: 10,
        title: "Quantum Warehouse",
        description: "Advanced warehouse management system with quantum-inspired interface design, inventory tracking, and real-time data visualization. Features modern UI/UX with interactive dashboards and responsive layouts. Pin : 911876418",
        technologies: ["HTML5", "CSS3", "JavaScript", "Data Visualization", "UI/UX"],
        category: "fullstack",
        icon: "fas fa-warehouse",
        github: "https://github.com/bwistrom/index.html",
        demo: "https://bwistrom.github.io/index.html"
    },
    {
        id: 11,
        title: "Visualisations of Universal Space",
        description: "Interactive space visualization application featuring cosmic animations, celestial body tracking, and immersive universe exploration. Built with advanced JavaScript graphics and responsive design for educational and entertainment purposes.",
        technologies: ["HTML5", "CSS3", "JavaScript", "Canvas API", "3D Graphics"],
        category: "fullstack",
        icon: "fas fa-rocket",
        github: "https://github.com/bwistrom/warp",
        demo: "https://bwistrom.github.io/warp/index.html"
    },
    {
        id: 12,
        title: "XYZ - Universal Grid Visualisation",
        description: "Advanced grid visualization system featuring dynamic data representation, interactive grid layouts, and real-time visual analytics. Built with modern web technologies for complex data visualization and user interaction.",
        technologies: ["HTML5", "CSS3", "JavaScript", "Grid Systems", "Data Visualization"],
        category: "fullstack",
        icon: "fas fa-th",
        github: "https://github.com/bwistrom/grid",
        demo: "https://bwistrom.github.io/grid/index.html"
    }
];

// Navigation elements
const hamburger = document.querySelector('.hamburger');
const navMenu = document.querySelector('.nav-menu');
const navLinks = document.querySelectorAll('.nav-link');

// Project filtering elements
const filterBtns = document.querySelectorAll('.filter-btn');
const projectsGrid = document.getElementById('projects-grid');

// Form elements
const contactForm = document.getElementById('contact-form');

// ============================================
// APPLICATION INITIALIZATION
// ============================================

document.addEventListener('DOMContentLoaded', function() {
    initializeNavigation();
    renderProjects('all');
    initializeProjectFilters();
    initializeContactForm();
    initializeScrollAnimations();
    updateStats();
    initializeSmoothScrolling();
});

// ============================================
// NAVIGATION FUNCTIONALITY
// ============================================

function initializeNavigation() {
    if (hamburger && navMenu) {
        hamburger.addEventListener('click', toggleMobileMenu);
        
        navLinks.forEach(link => {
            link.addEventListener('click', () => {
                if (navMenu.classList.contains('active')) {
                    toggleMobileMenu();
                }
            });
        });
    }
}

function toggleMobileMenu() {
    hamburger.classList.toggle('active');
    navMenu.classList.toggle('active');
    
    const bars = document.querySelectorAll('.bar');
    bars.forEach((bar, index) => {
        if (hamburger.classList.contains('active')) {
            if (index === 0) bar.style.transform = 'rotate(-45deg) translate(-5px, 6px)';
            if (index === 1) bar.style.opacity = '0';
            if (index === 2) bar.style.transform = 'rotate(45deg) translate(-5px, -6px)';
        } else {
            bar.style.transform = 'none';
            bar.style.opacity = '1';
        }
    });
}

function initializeProjectFilters() {
    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            filterBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            const category = btn.dataset.filter;
            renderProjects(category);
        });
    });
}

function initializeContactForm() {
    if (contactForm) {
        contactForm.addEventListener('submit', handleContactSubmit);
    }
}

function handleContactSubmit(e) {
    e.preventDefault();
    
    const formData = new FormData(contactForm);
    const name = formData.get('name');
    const email = formData.get('email');
    const message = formData.get('message');
    
    if (!name || !email || !message) {
        showNotification('Please fill in all fields.', 'error');
        return;
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        showNotification('Please enter a valid email address.', 'error');
        return;
    }
    
    showNotification(`Thank you ${name}! Your message has been received.`, 'success');
    contactForm.reset();
}

function showNotification(message, type = 'info') {
    const existingNotification = document.querySelector('.notification');
    if (existingNotification) {
        existingNotification.remove();
    }
    
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    
    notification.innerHTML = `
        <div class="notification-content">
            <i class="fas ${type === 'success' ? 'fa-check-circle' : type === 'error' ? 'fa-exclamation-circle' : 'fa-info-circle'}"></i>
            <span>${message}</span>
            <button class="notification-close" onclick="this.parentElement.parentElement.remove()">
                <i class="fas fa-times"></i>
            </button>
        </div>
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        if (notification && notification.parentElement) {
            notification.remove();
        }
    }, 5000);
    
    setTimeout(() => {
        notification.classList.add('show');
    }, 100);
}

function initializeScrollAnimations() {
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
            }
        });
    }, observerOptions);
    
    document.querySelectorAll('.fade-in').forEach(el => {
        observer.observe(el);
    });
    
    document.querySelectorAll('section').forEach(section => {
        section.classList.add('fade-in');
        observer.observe(section);
    });
}

function updateStats() {
    const projectsCount = document.getElementById('projects-count');
    const technologiesCount = document.getElementById('technologies-count');
    
    if (projectsCount && technologiesCount) {
        const allTechnologies = new Set();
        projects.forEach(project => {
            project.technologies.forEach(tech => allTechnologies.add(tech));
        });
        
        animateCounter(projectsCount, 0, projects.length, 1000);
        animateCounter(technologiesCount, 0, allTechnologies.size, 1200);
    }
}

function animateCounter(element, start, end, duration) {
    const range = end - start;
    const increment = range / (duration / 16);
    let current = start;
    
    const timer = setInterval(() => {
        current += increment;
        
        if (current >= end) {
            current = end;
            clearInterval(timer);
        }
        
        element.textContent = Math.floor(current);
    }, 16);
}

function initializeSmoothScrolling() {
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            
            const targetId = link.getAttribute('href');
            const targetSection = document.querySelector(targetId);
            
            if (targetSection) {
                const offsetTop = targetSection.offsetTop - 80;
                
                window.scrollTo({
                    top: offsetTop,
                    behavior: 'smooth'
                });
            }
        });
    });
}
