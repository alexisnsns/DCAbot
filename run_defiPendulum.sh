#!/bin/bash

cd /home/ec2-user/defiPendulum

export PATH=$PATH:/home/ec2-user/defiPendulum/node_modules/.bin

# Log the current time and script execution (this will overwrite the log file)
echo "$(date '+%b %e')" > /home/ec2-user/defiPendulum/pendulum/defiPendulum.log

# Run the TypeScript script with Node.js and append the script's output to the log
node --import ./register-ts-node.mjs pendulum/defiPendulum.ts >> /home/ec2-user/defiPendulum/pendulum/defiPendulum.log 2>&1