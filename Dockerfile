# Use the official Node.js 21.1.0 image
FROM node:21.1.0

# Create and change to the app directory
WORKDIR /app

# Copy application files
COPY . .

# Install dependencies
RUN npm install

# Expose the port the app runs on
EXPOSE 4000

# Run the application
CMD ["npm", "start"]
