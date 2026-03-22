module.exports = {
    apps: [
        {
            name: "youshop-api",
            script: "npm",
            args: "start",
            instances: "max", // Uses all available CPU cores
            exec_mode: "cluster", // Enables PM2's cluster mode to drastically boost throughput
            env: {
                NODE_ENV: "production",
            }
        }
    ]
};
