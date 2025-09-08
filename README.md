# Cannabis MMS Platform

A comprehensive MMS (Multimedia Messaging Service) platform specifically designed for cannabis and vape businesses to send compliant marketing messages to their customers.

## 🚀 Features

### Core Functionality

- **MMS Messaging**: Send multimedia messages (text, images, videos, audio) to customers
- **Multi-Provider Support**: Integration with Twilio, Bandwidth, and MessageBird
- **Message Templates**: Create and manage reusable message templates with variables
- **Scheduled Messaging**: Schedule messages for future delivery
- **Real-time Updates**: Live message status updates via WebSocket

### Compliance Features

- **Age Verification**: Built-in age verification for cannabis/vape industry compliance
- **Consent Management**: Proper consent collection and management
- **Content Screening**: Automated content screening for restricted keywords
- **Disclaimer Management**: Required disclaimers for cannabis/vape businesses
- **Opt-out Handling**: Automatic opt-out processing and compliance

### Business Management

- **Multi-Client Support**: Manage multiple cannabis/vape businesses
- **User Management**: Role-based access control (Admin, Client Admin, Client User)
- **Subscription Management**: Different subscription tiers with usage limits
- **Analytics Dashboard**: Comprehensive analytics and reporting
- **Compliance Monitoring**: Real-time compliance status monitoring

### Technical Features

- **RESTful API**: Well-documented REST API
- **Real-time Communication**: WebSocket integration for live updates
- **File Upload**: Secure media file upload and management
- **Rate Limiting**: Built-in rate limiting and abuse prevention
- **Security**: JWT authentication, data encryption, and security best practices

## 🛠️ Technology Stack

### Backend

- **Node.js** with Express.js
- **MongoDB** with Mongoose ODM
- **JWT** for authentication
- **Socket.io** for real-time communication
- **Multer** for file uploads
- **Cloudinary** for media storage
- **Twilio/Bandwidth/MessageBird** for MMS delivery

### Frontend

- **React** with TypeScript
- **Material-UI** for UI components
- **React Router** for navigation
- **Axios** for API communication
- **Socket.io Client** for real-time updates
- **Recharts** for analytics visualization

## 📋 Prerequisites

- Node.js (v16 or higher)
- MongoDB (v4.4 or higher)
- npm or yarn
- MMS provider account (Twilio, Bandwidth, or MessageBird)

## 🚀 Quick Start

### 1. Clone the Repository

```bash
git clone <repository-url>
cd cannabis-mms
```

### 2. Install Dependencies

```bash
# Install server dependencies
npm install

# Install client dependencies
cd client
npm install
cd ..
```

### 3. Environment Configuration

```bash
# Copy environment files
cp env.example .env
cp client/env.example client/.env

# Edit the .env files with your configuration
```

### 4. Database Setup

```bash
# Start MongoDB (if not already running)
mongod

# The application will create the database and collections automatically
```

### 5. Start the Application

```bash
# Start both server and client in development mode
npm run dev

# Or start them separately:
# Server: npm run server
# Client: cd client && npm start
```

### 6. Access the Application

- Frontend: http://localhost:3000
- Backend API: http://localhost:5000
- API Documentation: http://localhost:5000/api/health

## 🔧 Configuration

### Environment Variables

#### Server (.env)

```env
# Server Configuration
NODE_ENV=development
PORT=5000
CLIENT_URL=http://localhost:3000

# Database
MONGODB_URI=mongodb://localhost:27017/cannabis-mms

# JWT Secret
JWT_SECRET=your-super-secret-jwt-key-here

# MMS Provider (choose one)
TWILIO_ACCOUNT_SID=your-twilio-account-sid
TWILIO_AUTH_TOKEN=your-twilio-auth-token
TWILIO_FROM_NUMBER=+1234567890

# Cloudinary (for media uploads)
CLOUDINARY_CLOUD_NAME=your-cloudinary-cloud-name
CLOUDINARY_API_KEY=your-cloudinary-api-key
CLOUDINARY_API_SECRET=your-cloudinary-api-secret
```

#### Client (client/.env)

```env
# React App Configuration
REACT_APP_API_URL=http://localhost:5000
REACT_APP_SOCKET_URL=http://localhost:5000
```

### MMS Provider Setup

#### Twilio

1. Create a Twilio account at https://www.twilio.com
2. Get your Account SID and Auth Token
3. Purchase a phone number with MMS capabilities
4. Add credentials to your .env file

#### Bandwidth

1. Create a Bandwidth account at https://www.bandwidth.com
2. Get your Account ID, Username, and Password
3. Purchase a phone number with MMS capabilities
4. Add credentials to your .env file

#### MessageBird

1. Create a MessageBird account at https://www.messagebird.com
2. Get your API Key
3. Purchase a phone number with MMS capabilities
4. Add credentials to your .env file

## 📱 Usage

### 1. Registration

- Visit the registration page
- Fill in your business information
- Choose your business type (cannabis, vape, CBD, etc.)
- Provide your business license number

### 2. MMS Provider Setup

- Go to Settings > MMS Settings
- Select your MMS provider
- Enter your provider credentials
- Test the connection

### 3. Compliance Configuration

- Go to Settings > Compliance
- Configure age verification requirements
- Set up consent management
- Add restricted keywords
- Configure required disclaimers

### 4. Create Message Templates

- Go to Templates
- Create templates for different message types
- Use variables for personalization
- Test templates before using

### 5. Send Messages

- Go to Messages
- Compose new messages or use templates
- Add recipients with proper verification
- Schedule messages if needed
- Monitor delivery status

### 6. Monitor Compliance

- Check the Compliance dashboard
- Review violation reports
- Monitor compliance rates
- Update settings as needed

## 🔒 Security & Compliance

### Security Features

- JWT-based authentication
- Password hashing with bcrypt
- Rate limiting and abuse prevention
- Input validation and sanitization
- CORS protection
- Helmet.js security headers

### Compliance Features

- Age verification for cannabis/vape industry
- Consent management and tracking
- Content screening for restricted keywords
- Automatic disclaimer inclusion
- Opt-out processing
- Audit trails and reporting

### Data Protection

- Encrypted data storage
- Secure file uploads
- GDPR compliance features
- Data retention policies
- Secure API endpoints

## 📊 Analytics & Reporting

### Dashboard Metrics

- Total messages sent
- Delivery rates
- Template performance
- Compliance rates
- Cost analysis

### Reports Available

- Message delivery reports
- Compliance violation reports
- Template usage analytics
- Cost breakdown reports
- Customer engagement metrics

## 🚀 Deployment

### Production Deployment

1. Set up a production MongoDB instance
2. Configure environment variables for production
3. Set up a reverse proxy (nginx)
4. Use PM2 for process management
5. Set up SSL certificates
6. Configure monitoring and logging

### Docker Deployment

```bash
# Build and run with Docker Compose
docker-compose up -d
```

### Cloud Deployment

- **AWS**: Use EC2, RDS, and S3
- **Google Cloud**: Use Compute Engine, Cloud SQL, and Cloud Storage
- **Azure**: Use App Service, Cosmos DB, and Blob Storage

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## ⚠️ Legal Disclaimer

This software is designed for cannabis and vape businesses operating in jurisdictions where such businesses are legal. Users are responsible for ensuring compliance with all applicable laws and regulations in their jurisdiction. The software includes compliance features, but users must verify that their use complies with all relevant laws.

## 🆘 Support

For support and questions:

- Create an issue in the repository
- Check the documentation
- Contact the development team

## 🔄 Updates

### Version 1.0.0

- Initial release
- Core MMS functionality
- Compliance features
- Multi-provider support
- Analytics dashboard
- User management

### Planned Features

- Advanced analytics
- A/B testing for messages
- Customer segmentation
- Advanced scheduling
- API webhooks
- Mobile app
- White-label solutions

---

**Note**: This platform is specifically designed for cannabis and vape businesses and includes industry-specific compliance features. Ensure you understand and comply with all applicable laws and regulations in your jurisdiction before using this software.
