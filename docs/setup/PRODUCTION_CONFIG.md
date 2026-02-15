# Database Configuration for KRIYA IDE

## Environment Variables

Set these in your deployment environment:

```bash
# Database connections (optional - for database features)
DB_MYSQL_HOST=your-mysql-host
DB_MYSQL_PORT=3306
DB_MYSQL_USER=your-username
DB_MYSQL_PASSWORD=your-password
DB_MYSQL_DATABASE=your-database

DB_POSTGRES_HOST=your-postgres-host
DB_POSTGRES_PORT=5432
DB_POSTGRES_USER=your-username
DB_POSTGRES_PASSWORD=your-password
DB_POSTGRES_DATABASE=your-database

DB_MONGODB_URI=mongodb://username:password@host:port/database

# AWS Configuration (required for backend)
AWS_REGION=ap-south-1
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key

# JWT Secret for authentication
JWT_SECRET=your-jwt-secret-key
```

## AWS Systems Manager Parameter Store

For production, store sensitive values in AWS Parameter Store:

```bash
# Store database credentials securely
aws ssm put-parameter --name "/kriya/db/mysql/host" --value "your-host" --type "String"
aws ssm put-parameter --name "/kriya/db/mysql/password" --value "your-password" --type "SecureString"

# Store JWT secret
aws ssm put-parameter --name "/kriya/jwt/secret" --value "your-jwt-secret" --type "SecureString"
```

## Database Setup

### MySQL
```sql
CREATE DATABASE kriya_ide;
CREATE USER 'kriya'@'%' IDENTIFIED BY 'your-password';
GRANT ALL PRIVILEGES ON kriya_ide.* TO 'kriya'@'%';
FLUSH PRIVILEGES;
```

### PostgreSQL
```sql
CREATE DATABASE kriya_ide;
CREATE USER kriya WITH PASSWORD 'your-password';
GRANT ALL PRIVILEGES ON DATABASE kriya_ide TO kriya;
```

### MongoDB
```javascript
use kriya_ide
db.createUser({
  user: "kriya",
  pwd: "your-password",
  roles: [{ role: "readWrite", db: "kriya_ide" }]
})
```

## Features Enabled

With real backend connections:

✅ **Real-time Collaboration** - WebSocket connections to AWS
✅ **Database Management** - Connect to MySQL, PostgreSQL, SQLite, MongoDB
✅ **File Operations** - Real file system operations
✅ **Package Management** - npm/yarn package installation
✅ **Code Execution** - Server-side code execution
✅ **Authentication** - JWT-based authentication
✅ **Document Storage** - DynamoDB document storage
✅ **Session Management** - Redis-based sessions

## Security Notes

- All database connections use parameterized queries
- Input validation on all API endpoints
- Rate limiting implemented
- CORS properly configured
- Secrets stored in AWS Parameter Store
- JWT tokens with expiration