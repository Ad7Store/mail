// GitHub API integration
class GitHubAPI {
    constructor() {
        this.baseURL = 'https://api.github.com';
        this.repo = 'your-username/your-repo-name'; // Change this
        this.token = 'your-github-token'; // Use environment variable in production
    }
    
    async request(endpoint, method = 'GET', data = null) {
        const url = `${this.baseURL}${endpoint}`;
        const headers = {
            'Authorization': `token ${this.token}`,
            'Accept': 'application/vnd.github.v3+json',
            'Content-Type': 'application/json'
        };
        
        const options = {
            method,
            headers,
            body: data ? JSON.stringify(data) : null
        };
        
        try {
            const response = await fetch(url, options);
            if (!response.ok) {
                throw new Error(`GitHub API error: ${response.status}`);
            }
            return await response.json();
        } catch (error) {
            console.error('GitHub API request failed:', error);
            throw error;
        }
    }
    
    async createFile(path, content, message) {
        const endpoint = `/repos/${this.repo}/contents/${path}`;
        const data = {
            message: message,
            content: btoa(JSON.stringify(content, null, 2))
        };
        
        return await this.request(endpoint, 'PUT', data);
    }
    
    async getFile(path) {
        const endpoint = `/repos/${this.repo}/contents/${path}`;
        try {
            const file = await this.request(endpoint);
            return JSON.parse(atob(file.content));
        } catch (error) {
            return null;
        }
    }
}

// Export singleton instance
const githubAPI = new GitHubAPI();
