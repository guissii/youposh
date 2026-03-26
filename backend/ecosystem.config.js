module.exports = {
    apps: [
        {
            name: "youshop-api",
            script: "dist/index.js", // Direct path to the compiled file
            instances: 2, // Limité à 2 instances pour éviter les crashs de RAM (OOM)
            exec_mode: "cluster", // Enables PM2's cluster mode to drastically boost throughput
            env: {
                NODE_ENV: "production",
                UMASK: "0022" // Ensures uploaded files are readable by everyone (Nginx)
            }
        }
    ]
};
