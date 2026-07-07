#!/bin/bash

read -p "> Deploy a new app instance on Digital Ocean (y/n): " should_deploy_new 

if [ "$should_deploy_new" = "y" ]; then
    read -p "> Spec file (relative directory): " spec_file

    if [ -z "$spec_file" ]; then
        echo -e "\n> Error: Please provide a spec file!\n"
        exit 1
    fi

    echo -e "Now creating new Digital Ocean deploy (using doctl command)\n"

    doctl databases create saabi-valkey \
        --engine valkey \
        --region lon1 \
        --size db-s-1vcpu-1gb \
        --num-nodes 1

    doctl databases create saabi-pg \
        --engine pg --version 16 \
        --region lon1 --size db-s-1vcpu-1gb --num-nodes 1

    doctl apps create --spec "$spec_file"

elif [ "$should_deploy_new" = "n" ]; then
    read -p "> App ID: " app_id

    if [ -z "$app_id" ]; then
        echo -e "\n> Error: Please provide an app id\n"
    fi

    read -p "> Spec file (relative directory): " spec_file

    if [ -z "$spec_file" ]; then
        echo -e "\n> Falling back to default app.local.yml\n"
        spec_file=./.do/app.local.yml
    fi

    doctl apps update "$app_id" --spec "$spec_file"
else
    echo -e "\n> Error: Please use either y or n\n"
    exit 1
fi