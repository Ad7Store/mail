
## Setup Instructions

### 1. GitHub Repository Setup

1. Create a new GitHub repository
2. Generate a Personal Access Token with `repo` permissions:
   - Go to GitHub Settings → Developer Settings → Personal Access Tokens
   - Generate new token with `repo` scope
   - Copy the token

### 2. Vercel Deployment

1. Create a Vercel account (vercel.com)
2. Import your GitHub repository
3. Add environment variables in Vercel:
   - `GITHUB_TOKEN`: Your GitHub personal access token
   - `GITHUB_REPO`: Your repository name (format: `username/repo-name`)
   - `GITHUB_OWNER`: Your GitHub username

4. Deploy the project

### 3. Initial Setup in GitHub

After first deployment, you need to create initial data structure:

1. Go to your GitHub repository
2. Create a folder named `data`
3. Inside `data`, create these files:
   - `users.json` (initial content: `[]`)
   - `all_friends.json` (initial content: `[]`)
   - `all_withdrawals.json` (initial content: `[]`)

### 4. Create Admin User

1. Open the deployed application
2. Sign up with the following details (or modify later):
   - Username: `admin`
   - Password: Choose a strong password
   - Full Name: `Administrator`
   - WhatsApp: Your number

3. After creating the account, note the User ID
4. Go to your GitHub repository, edit `data/users.json`
5. Find your user object and add: `"isAdmin": true`

## Configuration

### Task Rates
The rates are hardcoded in the task system:
- 1-20 friends: Rs. 90/friend
- 21-30 friends: Rs. 100/friend
- 31-50 friends: Rs. 110/friend
- 51-100 friends: Rs. 130/friend
- 100+ friends: Rs. 150/friend

### Withdrawal Rules
- Minimum balance: Rs. 1550
- Minimum verified friends: 10
- Processing time: 72 hours

## Security Notes

1. **GitHub Token Security**: The token is stored in Vercel environment variables
2. **Password Storage**: Passwords are stored in plain text in GitHub (for simplicity)
3. **Admin Access**: Only users with `isAdmin: true` can access admin dashboard
4. **Session Management**: Uses browser sessionStorage for temporary login

## Customization

1. **Change Colors**: Modify CSS variables in `css/styles.css`
2. **Change Rates**: Update rate calculation in `js/task.js`
3. **Add New Features**: Extend the existing JavaScript files
4. **Modify Rules**: Update withdrawal rules in `js/withdraw.js`

## Support

For support, email: dripmobiles@gmail.com

## License

This project is for educational purposes.
