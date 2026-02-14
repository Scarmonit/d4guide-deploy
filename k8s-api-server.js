/**
 * Kubernetes/Docker Status API Server
 * Run this locally to provide live data to the Kubernetes dashboard
 *
 * Usage: node k8s-api-server.js
 * API will be available at http://localhost:3001
 */

const http = require('http');
const { exec } = require('child_process');
const { promisify } = require('util');

const execAsync = promisify(exec);
const PORT = 3001;

// CORS headers for browser access
const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json'
};

// Execute command and return stdout
async function runCommand(cmd) {
    try {
        console.log(`Executing: ${cmd}`);
        // Use powershell on Windows for better compatibility
        const shell = process.platform === 'win32' ? 'powershell.exe' : '/bin/sh';
        const { stdout, stderr } = await execAsync(cmd, { 
            timeout: 10000, 
            shell: shell 
        });
        
        if (stderr) console.warn(`Stderr for ${cmd}:`, stderr);
        
        return { success: true, data: stdout.trim(), error: null };
    } catch (error) {
        console.error(`Error executing ${cmd}:`, error.message);
        return { success: false, data: null, error: error.message };
    }
}

// Parse kubectl get pods output to JSON
function parsePodsOutput(output) {
    if (!output) return [];
    const lines = output.split('\n').filter(l => l.trim());
    if (lines.length < 2) return [];

    const headers = lines[0].toLowerCase().split(/\s+/);
    return lines.slice(1).map(line => {
        const values = line.split(/\s+/);
        const pod = {};
        headers.forEach((h, i) => {
            pod[h] = values[i] || '';
        });
        return pod;
    });
}

// Parse docker ps output to JSON
function parseDockerOutput(output) {
    if (!output) return [];
    const lines = output.split('\n').filter(l => l.trim());
    return lines.map(line => {
        try {
            return JSON.parse(line);
        } catch {
            return null;
        }
    }).filter(Boolean);
}

// API handlers
const handlers = {
    // Get all Kubernetes pods
    '/api/pods': async () => {
        const result = await runCommand('kubectl get pods -A -o wide');
        if (result.success) {
            return { pods: parsePodsOutput(result.data) };
        }
        return { error: result.error, pods: [] };
    },

    // Get pods by namespace
    '/api/pods/:namespace': async (namespace) => {
        const result = await runCommand(`kubectl get pods -n ${namespace} -o wide`);
        if (result.success) {
            return { namespace, pods: parsePodsOutput(result.data) };
        }
        return { error: result.error, pods: [] };
    },

    // Get Kubernetes services
    '/api/services': async () => {
        const result = await runCommand('kubectl get services -A');
        if (result.success) {
            return { services: parsePodsOutput(result.data) };
        }
        return { error: result.error, services: [] };
    },

    // Get Docker containers
    '/api/containers': async () => {
        const result = await runCommand('docker ps --format "{{json .}}"');
        if (result.success) {
            return { containers: parseDockerOutput(result.data) };
        }
        return { error: result.error, containers: [] };
    },

    // Get Docker stats
    '/api/docker/stats': async () => {
        const result = await runCommand('docker stats --no-stream --format "{{json .}}"');
        if (result.success) {
            return { stats: parseDockerOutput(result.data) };
        }
        return { error: result.error, stats: [] };
    },

    // Get cluster info
    '/api/cluster': async () => {
        const [nodesResult, versionResult] = await Promise.all([
            runCommand('kubectl get nodes -o wide'),
            runCommand('kubectl version --short 2>/dev/null || kubectl version')
        ]);
        return {
            nodes: nodesResult.success ? parsePodsOutput(nodesResult.data) : [],
            version: versionResult.success ? versionResult.data : null
        };
    },

    // Get namespaces
    '/api/namespaces': async () => {
        const result = await runCommand('kubectl get namespaces');
        if (result.success) {
            return { namespaces: parsePodsOutput(result.data) };
        }
        return { error: result.error, namespaces: [] };
    },

    // Get resource usage (top)
    '/api/top/pods': async () => {
        const result = await runCommand('kubectl top pods -A 2>/dev/null');
        if (result.success) {
            return { usage: parsePodsOutput(result.data) };
        }
        return { error: result.error || 'Metrics server not available', usage: [] };
    },

    // Health check
    '/api/health': async () => {
        let ollamaSuccess = false;
        try {
            // Use native fetch for Ollama check
            const response = await fetch('http://localhost:11434/api/tags');
            ollamaSuccess = response.ok;
        } catch (e) {
            console.error('Ollama check failed:', e.message);
        }

        const [k8s, docker] = await Promise.all([
            runCommand('kubectl cluster-info'),
            runCommand('docker info --format "{{.ServerVersion}}"')
        ]);
        
        return {
            kubernetes: k8s.success,
            docker: docker.success,
            ollama: ollamaSuccess,
            timestamp: new Date().toISOString()
        };
    },

    // Combined dashboard data
    '/api/dashboard': async () => {
        const [pods, services, containers, health] = await Promise.all([
            handlers['/api/pods'](),
            handlers['/api/services'](),
            handlers['/api/containers'](),
            handlers['/api/health']()
        ]);
        return { pods, services, containers, health };
    }
};

// HTTP server
const server = http.createServer(async (req, res) => {
    // Handle CORS preflight
    if (req.method === 'OPTIONS') {
        res.writeHead(204, corsHeaders);
        res.end();
        return;
    }

    const url = new URL(req.url, `http://localhost:${PORT}`);
    const path = url.pathname;

    // Check for parameterized routes
    let handler = handlers[path];
    let param = null;

    if (!handler) {
        // Check for /api/pods/:namespace pattern
        const podsMatch = path.match(/^\/api\/pods\/(.+)$/);
        if (podsMatch) {
            handler = handlers['/api/pods/:namespace'];
            param = podsMatch[1];
        }
    }

    if (handler) {
        try {
            const data = param ? await handler(param) : await handler();
            res.writeHead(200, corsHeaders);
            res.end(JSON.stringify(data, null, 2));
        } catch (error) {
            res.writeHead(500, corsHeaders);
            res.end(JSON.stringify({ error: error.message }));
        }
    } else {
        // List available endpoints
        res.writeHead(200, corsHeaders);
        res.end(JSON.stringify({
            message: 'Kubernetes/Docker Status API',
            endpoints: Object.keys(handlers).filter(k => !k.includes(':')),
            usage: 'Access any endpoint to get live cluster data'
        }, null, 2));
    }
});

server.listen(PORT, () => {
    console.log(`\n🚀 K8s/Docker API Server running at http://localhost:${PORT}\n`);
    console.log('Available endpoints:');
    Object.keys(handlers).forEach(endpoint => {
        if (!endpoint.includes(':')) {
            console.log(`  GET ${endpoint}`);
        }
    });
    console.log(`  GET /api/pods/{namespace}`);
    console.log('\nPress Ctrl+C to stop\n');
});
