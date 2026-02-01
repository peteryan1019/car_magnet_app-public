# car_magnet_app

##Project Overview

This project will provide automated advertisement designs, primarily focusing on car magnet designs. Core advantages of this app will be in the design of two-door magnets catered to cars of any size. Two-door car magnets are magnets pieced together by two separate magnets, one on the front door, the second on the rear door. 

## Setup

This project using the NextJs framework with Typescript and App Routers.

All src code resides in the **app** directory.

The backend uses serverless postgres databases via NeonDB to enable future scaling, and all database operations are carried out using Drizzle ORM instead of raw SQL for type safety and security. 

To view the site, run `pnpm install` in the auto_magnet_design directory. Make sure to approve builds for post-install scripts if necessary.

Then run `pnpm run dev`, and navigate to the url shown in the terminal.

A minimal register/login functionality is present for now. The full features list can be found in doc/sprint0/product.md. 

## Contribution Guidelines
Contributors can push documentations to main directly, but must open Pull Requests to main for functionality changes of the app.

## Branching Strategy

A variation of Git Flow will be used, with the only difference being when two people work on the same feature, their feature name will be suffixed with their names. E.g. feature/magnet_design_John

## Ticketing Guidelines
Immediate to-dos will be specified in the Slack channel. Product backlog tickets will be completed on Jira. 
