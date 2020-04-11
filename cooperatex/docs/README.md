# CooperaTeX Documentation

# Table of Contents

1. [REST API Documentation](#rest-api-documentation)
   1. [Users API](#users-api)
   2. [Projects API](#projects-api)
   3. [Invitations API](#invitations-api)
2. [WebSocket API Documentation](#websocket-api-documentation)

---

# REST API Documentation

## Users API

### Create

- description: Create a new account and signs in
- request: `POST /api/users/signup`
  - content-type: `application/json`
  - body: object
    - username: (string) user's username
    - password: (string) user's password
- response: 200
- response: 400
  - Username must be alphanumeric
  - Username must be between 3 and 20 characters long
  - Password must be between 8 and 20 characters long
- response: 409
  - Username `:username` already exists
- response: 500

```
$ curl -X POST
       -H "Content-Type: `application/json`"
       -d '{"username": "user_name", "password":"123456789"}
       https://cooperatex.me/api/users/signup/'
```

- description: Sign in with existing account
- request: `POST /api/users/signin`
  - content-type: `application/json`
  - body: object
    - username: (string) user's username
    - password: (string) user's password
- response: 200
- response: 400
  - Username must be alphanumeric
  - Username must be between 3 and 20 characters long
  - Password must be between 8 and 20 characters long
- response: 401
  - User was not found
  - Password was incorrect

```
$ curl -X POST
       -H "Content-Type: `application/json`"
       -d '{"username": "user_name", "password":"123456789"}
       https://cooperatex.me/api/users/signin/'
```

---

## Projects API

### Index

#### User

- user: (object)
  - \_id: (object) MongoDB Object ID for the user
  - username: (string) user's username

#### File

- file: (object) file metadata for the project
  - fieldname: (string) field name specified in the form
  - originalname: (string) name of the file on the user's computer
  - encoding: (string) encoding type of the file
  - mimetype: (string) mime type of the file
  - size: (string) size of the file in bytes
  - isMain: (boolean) indicates the file to be compiled

#### Collaborator

- collaborator: (object) users who have access to project
  - pendingInvitation: (boolean) whether or not the invitation has been accepted or rejected,
  - acceptedInvitation: (boolean) whether or not the invitation has been accepted,
  - access: (string) access level of collaborator (one of `"read", "readWrite"`)
  - user: ([User](#user)) user id and name of the collaborator

#### Project

- project: (object) all project-related data
  - \_id: (object) MongoDB Object ID for the user
  - owner: ([User](#user)) project creator
  - title: (string) project title
  - collaborators: [\[Collaborator\]](#collaborator) list of collaborators in the project
  - lastUpdated: (Date) date project last modified
  - lastUpdatedBy: ([User](#user)) user who modified project last
  - files: [\[File\]](#file) list of files in project
  - dateCreated: (Date) date project was created

---

### Create

- description: Creates a project
- request: `POST /api/projects`
  - content-type: `application/json`
  - body: object
    - title: title of the project
    - template: initial template for the project (one of `"default", "cover-letter", "title-page", "resume"`)
- response: 200
  - content-type: `application/json`
  - body: [Project](#project)
- response: 400
  - Title must exist (not null and not falsy)
  - Title must be between 1 and 50 characters long
  - Template must exist (not null and not falsy)
  - Template must be one of `"default", "cover-letter", "title-page", "resume"`
- response: 403
  - Must be signed in
- response: 404
  - Template `:template` does not exist
- response: 500

```
$ curl -X POST
       -H "Content-Type: `application/json`"
       -H "Authorization: `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJfaWQiOiI1ZTkwNDYwNTdhMWIxNDNjYTE4NmE5N2MiLCJ1c2VybmFtZSI6IjEyMyIsImV4cCI6MTU4NzE1ODQ5NywiaWF0IjoxNTg2NTUzNjk3fQ.IgM9Pvtqy8EpbLGSi-E05TWm1Y2sOW-0cd2usn61qoI`
       -d '{"title": "test project", "template": "default"}
       https://cooperatex.me/api/projects/'
```

- description: Uploads multiple files to a given project
- request: `POST /api/projects/:id/files`
  - content-type: `multipart/form-data`
  - form: (object)
    - files: the files to upload
- response: 200
  - content-type: `application/json`
  - body: [\[File\]](#file)
- response: 400
  - id must exist (not null and not falsy)
  - id must be a MongoDB Object ID
  - uploaded files must be `.png, .jpg, .jpeg, application/x-tex, application/x-latex`
  - uploaded files must be less than 20MB in size
- response: 403
  - Must be signed in
  - Must be either owner or collaborator with `readWrite` access
- response: 404
  - Project `:id` does not exist
- response: 409
  - File `:id` does not exist
- response: 500

```
$ curl -X POST
       -H "Content-Type: `multipart/form-data`"
       -H "Authorization: `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJfaWQiOiI1ZTkwNDYwNTdhMWIxNDNjYTE4NmE5N2MiLCJ1c2VybmFtZSI6IjEyMyIsImV4cCI6MTU4NzE1ODQ5NywiaWF0IjoxNTg2NTUzNjk3fQ.IgM9Pvtqy8EpbLGSi-E05TWm1Y2sOW-0cd2usn61qoI`
       -F "files[]=@/home/user/Desktop/test1.png"
       ...
       -F "files[]=@/home/user/Desktop/test2.tex"
       https://cooperatex.me/api/projects/5e90460b7a1b14133f86a97d/files'
```

- description: Invites a collaborator to a given project
- request: `POST /api/projects/:id/collaborators`
  - content-type: `application/json`
  - body: (object)
    - username: (string) username of the collaborator to invite
    - access: (string) access level of collaborator (one of `"read", "readWrite"`)
- response: 200
  - content-type: `application/json`
  - body: [Collaborator](#collaborator)
- response: 400
  - id must exist (not null and not falsy)
  - id must be a MongoDB Object ID
- response: 403
  - Must be signed in
  - Must be owner
- response: 404
  - Project `:id` does not exist
  - Username `:username` does not exist
- response: 409
  - Username `:username` already exists as a collaborator
- response: 500

```
$ curl -X POST
       -H "Content-Type: `application/json`"
       -H "Authorization: `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJfaWQiOiI1ZTkwNDYwNTdhMWIxNDNjYTE4NmE5N2MiLCJ1c2VybmFtZSI6IjEyMyIsImV4cCI6MTU4NzE1ODQ5NywiaWF0IjoxNTg2NTUzNjk3fQ.IgM9Pvtqy8EpbLGSi-E05TWm1Y2sOW-0cd2usn61qoI`
       -d '{"username": "user_name", "access": "readWrite"}
       https://cooperatex.me/api/projects/5e90460b7a1b14133f86a97d/collaborators'
```

### Read

- description: Retrieves all projects
- request: `GET /api/projects`
- response: 200
  - content-type: `application/json`
  - body: [Project](#project)
- response: 403
  - Must be signed in
- response: 500

```
$ curl -X GET
       -H "Content-Type: `application/json`"
       -H "Authorization: `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJfaWQiOiI1ZTkwNDYwNTdhMWIxNDNjYTE4NmE5N2MiLCJ1c2VybmFtZSI6IjEyMyIsImV4cCI6MTU4NzE1ODQ5NywiaWF0IjoxNTg2NTUzNjk3fQ.IgM9Pvtqy8EpbLGSi-E05TWm1Y2sOW-0cd2usn61qoI`
       https://cooperatex.me/api/projects/'
```

- description: Retrieves a project given its id
- request: `GET /api/projects/:id`
- response: 200
  - content-type: `application/json`
  - body: [Project](#project)
- response: 400
  - id must exist (not null and not falsy)
  - id must be a MongoDB Object ID
- response: 403
  - Must be signed in
  - Must be either owner or collaborator
- response: 404
  - Project `:id` does not exist
- response: 500

```
$ curl -X GET
       -H "Content-Type: `application/json`"
       -H "Authorization: `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJfaWQiOiI1ZTkwNDYwNTdhMWIxNDNjYTE4NmE5N2MiLCJ1c2VybmFtZSI6IjEyMyIsImV4cCI6MTU4NzE1ODQ5NywiaWF0IjoxNTg2NTUzNjk3fQ.IgM9Pvtqy8EpbLGSi-E05TWm1Y2sOW-0cd2usn61qoI`
       https://cooperatex.me/api/projects/5e90460b7a1b14133f86a97d'
```

- description: Retrieves all files in a project
- request: `GET /api/projects/:id/files`
- response: 200
  - content-type: `application/json`
  - body: [\[File\]](#file)
- response: 400
  - id must exist (not null and not falsy)
  - id must be a MongoDB Object ID
- response: 403
  - Must be signed in
  - Must be either owner or collaborator
- response: 404
  - Project `:id` does not exist
- response: 500

```
$ curl -X GET
       -H "Content-Type: `application/json`"
       -H "Authorization: `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJfaWQiOiI1ZTkwNDYwNTdhMWIxNDNjYTE4NmE5N2MiLCJ1c2VybmFtZSI6IjEyMyIsImV4cCI6MTU4NzE1ODQ5NywiaWF0IjoxNTg2NTUzNjk3fQ.IgM9Pvtqy8EpbLGSi-E05TWm1Y2sOW-0cd2usn61qoI`
       https://cooperatex.me/api/projects/5e90460b7a1b14133f86a97d/files'
```

- description: Retrieves file given by id in a project
- request: `GET /api/projects/:projectId/files/:fileId`
- response: 200
  - content-type: `*/*`
  - body: file itself
- response: 400
  - project id must exist (not null and not falsy)
  - project id must be a MongoDB Object ID
  - file id must exist (not null and not falsy)
  - file id must be a MongoDB Object ID
- response: 403
  - Must be signed in
  - Must be either owner or collaborator
- response: 404
  - Project `:projectId` does not exist
  - File `:fileId` does not exist
- response: 500

```
$ curl -X GET
       -H "Content-Type: `*/*`"
       -H "Authorization: `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJfaWQiOiI1ZTkwNDYwNTdhMWIxNDNjYTE4NmE5N2MiLCJ1c2VybmFtZSI6IjEyMyIsImV4cCI6MTU4NzE1ODQ5NywiaWF0IjoxNTg2NTUzNjk3fQ.IgM9Pvtqy8EpbLGSi-E05TWm1Y2sOW-0cd2usn61qoI`
       https://cooperatex.me/api/projects/5e90460b7a1b14133f86a97d/files/5e90460b7a1b14232a85a23e'
```

- description: Retrieves the compiled output PDF of a given project
- request: `GET /api/projects/:id/output`
- response: 200
  - content-type: `application/pdf`
  - body: output pdf
- response: 400
  - id must exist (not null and not falsy)
  - id must be a MongoDB Object ID
- response: 403
  - Must be signed in
  - Must be either owner or collaborator
- response: 404
  - Project `:id` does not exist
- response: 409
  - Compilation error
- response: 500

```
$ curl -X GET
       -H "Content-Type: `application/pdf`"
       -H "Authorization: `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJfaWQiOiI1ZTkwNDYwNTdhMWIxNDNjYTE4NmE5N2MiLCJ1c2VybmFtZSI6IjEyMyIsImV4cCI6MTU4NzE1ODQ5NywiaWF0IjoxNTg2NTUzNjk3fQ.IgM9Pvtqy8EpbLGSi-E05TWm1Y2sOW-0cd2usn61qoI`
       https://cooperatex.me/api/projects/5e90460b7a1b14133f86a97d/output'
```

- description: Retrieves the source files of a given project compressed into a zip file
- request: `GET /api/projects/:id/source`
- response: 200
  - content-type: `application/zip`
  - body: source files compressed into a zip file
- response: 400
  - id must exist (not null and not falsy)
  - id must be a MongoDB Object ID
- response: 403
  - Must be signed in
  - Must be either owner or collaborator
- response: 404
  - Project `:id` does not exist
- response: 500

```
$ curl -X GET
       -H "Content-Type: `application/zip`"
       -H "Authorization: `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJfaWQiOiI1ZTkwNDYwNTdhMWIxNDNjYTE4NmE5N2MiLCJ1c2VybmFtZSI6IjEyMyIsImV4cCI6MTU4NzE1ODQ5NywiaWF0IjoxNTg2NTUzNjk3fQ.IgM9Pvtqy8EpbLGSi-E05TWm1Y2sOW-0cd2usn61qoI`
       https://cooperatex.me/api/projects/5e90460b7a1b14133f86a97d/source'
```

- description: Retrieves all collaborators in a given project
- request: `GET /api/projects/:id/collaborators`
- response: 200
  - content-type: `application/json`
  - body: [\[Collaborator\]](#collaborator)
- response: 400
  - id must exist (not null and not falsy)
  - id must be a MongoDB Object ID
- response: 403
  - Must be signed in
  - Must be either owner or collaborator
- response: 404
  - Project `:id` does not exist
- response: 500

```
$ curl -X GET
       -H "Content-Type: `application/json`"
       -H "Authorization: `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJfaWQiOiI1ZTkwNDYwNTdhMWIxNDNjYTE4NmE5N2MiLCJ1c2VybmFtZSI6IjEyMyIsImV4cCI6MTU4NzE1ODQ5NywiaWF0IjoxNTg2NTUzNjk3fQ.IgM9Pvtqy8EpbLGSi-E05TWm1Y2sOW-0cd2usn61qoI`
       https://cooperatex.me/api/projects/5e90460b7a1b14133f86a97d/collaborators'
```

### Update

- description: Modify a given file in a given project
- request: `PATCH /api/projects/:projectId/files/:fileId`
  - content-type: `application/json`
  - body: (object)
    - operation: (string) the type of operation that needs to be performed (one of `"replaceName", "replaceMain", "replaceContents"`)
    - newName?: (string) if `operation == "replaceName"`, the replacement name
    - newContents?: (string) if `operation == "replaceContents"`, the replacement file contents
- response: 200
- response: 400
  - project id must exist (not null and not falsy)
  - project id must be a MongoDB Object ID
  - file id must exist (not null and not falsy)
  - file id must be a MongoDB Object ID
  - operation must exist (not null and not falsy)
  - operation must be one of `"replaceName", "replaceMain", "replaceContents"`
  - if `operation == "replaceName"`, new name must exist (not null and not falsy)
  - if `operation == "replaceName"`, new name must be between 1 and 50 characters long
- response: 403
  - Must be signed in
  - Must be either owner or collaborator with `readWrite` access
- response: 404
  - Project `:projectId` does not exist
  - File `:fileId` does not exist
- response: 409
  - File name exists
- response: 500

```
$ curl -X PATCH
       -H "Content-Type: `application/json`"
       -H "Authorization: `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJfaWQiOiI1ZTkwNDYwNTdhMWIxNDNjYTE4NmE5N2MiLCJ1c2VybmFtZSI6IjEyMyIsImV4cCI6MTU4NzE1ODQ5NywiaWF0IjoxNTg2NTUzNjk3fQ.IgM9Pvtqy8EpbLGSi-E05TWm1Y2sOW-0cd2usn61qoI`
       -d '{"operation": "replaceName", "newName": "New project name"}
       https://cooperatex.me/api/projects/5e90460b7a1b14133f86a97d/files/5e90460b7a1b14232a85a23e'
```

- description: Accepting or rejecting an invitation to a given project
- request: `PATCH /api/projects/:id/collaborators`
  - content-type: `application/json`
  - body: (object)
    - operation: (string) the type of operation that needs to be performed (one of `"accept", "reject"`)
- response: 200
- response: 400
  - id must exist (not null and not falsy)
  - id must be a MongoDB Object ID
- response: 403
  - Must be signed in
  - Must be collaborator invited
- response: 404
  - Project `:id` does not exist
- response: 500

```
$ curl -X PATCH
       -H "Authorization: `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJfaWQiOiI1ZTkwNDYwNTdhMWIxNDNjYTE4NmE5N2MiLCJ1c2VybmFtZSI6IjEyMyIsImV4cCI6MTU4NzE1ODQ5NywiaWF0IjoxNTg2NTUzNjk3fQ.IgM9Pvtqy8EpbLGSi-E05TWm1Y2sOW-0cd2usn61qoI`
       -d '{"operation": "accept"}
       https://cooperatex.me/api/projects/5e90460b7a1b14133f86a97d/collaborators'
```

### Delete

- description: Deletes a project given its id
- request: `DELETE /api/projects/:id`
- response: 200
- response: 400
  - id must exist (not null and not falsy)
  - id must be a MongoDB Object ID
- response: 403
  - Must be signed in
  - Must be owner
- response: 404
  - Project `:id` does not exist
- response: 500

```
$ curl -X DELETE
       -H "Authorization: `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJfaWQiOiI1ZTkwNDYwNTdhMWIxNDNjYTE4NmE5N2MiLCJ1c2VybmFtZSI6IjEyMyIsImV4cCI6MTU4NzE1ODQ5NywiaWF0IjoxNTg2NTUzNjk3fQ.IgM9Pvtqy8EpbLGSi-E05TWm1Y2sOW-0cd2usn61qoI`
       https://cooperatex.me/api/projects/5e90460b7a1b14133f86a97d'
```

- description: Delete a given file in a given project
- request: `DELETE /api/projects/:projectId/files/:fileId`
- response: 200
- response: 400
  - project id must exist (not null and not falsy)
  - project id must be a MongoDB Object ID
  - file id must exist (not null and not falsy)
  - file id must be a MongoDB Object ID
- response: 403
  - Must be signed in
  - Must be either owner or collaborator with `readWrite` access
- response: 404
  - Project `:projectId` does not exist
  - File `:fileId` does not exist
- response: 500

```
$ curl -X DELETE
       -H "Authorization: `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJfaWQiOiI1ZTkwNDYwNTdhMWIxNDNjYTE4NmE5N2MiLCJ1c2VybmFtZSI6IjEyMyIsImV4cCI6MTU4NzE1ODQ5NywiaWF0IjoxNTg2NTUzNjk3fQ.IgM9Pvtqy8EpbLGSi-E05TWm1Y2sOW-0cd2usn61qoI`
       https://cooperatex.me/api/projects/5e90460b7a1b14133f86a97d/files/5e90460b7a1b14232a85a23e'
```

- description: Revokes access of a collaborator or removes a collaborator from a given project
- request: `DELETE /api/projects/:projectId/collaborators/:userId`
- response: 200
- response: 400
  - project id must exist (not null and not falsy)
  - project id must be a MongoDB Object ID
  - user id must exist (not null and not falsy)
  - user id must be a MongoDB Object ID
- response: 403
  - Must be signed in
  - Must be owner or collaborator removing oneself from project
- response: 404
  - Project `:projectId` does not exist
  - User `:userId` does not exist
  - User `:userId` does not exist as a collaborator
- response: 500

```
$ curl -X DELETE
       -H "Authorization: `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJfaWQiOiI1ZTkwNDYwNTdhMWIxNDNjYTE4NmE5N2MiLCJ1c2VybmFtZSI6IjEyMyIsImV4cCI6MTU4NzE1ODQ5NywiaWF0IjoxNTg2NTUzNjk3fQ.IgM9Pvtqy8EpbLGSi-E05TWm1Y2sOW-0cd2usn61qoI`
       https://cooperatex.me/api/projects/5e90460b7a1b14133f86a97d/collaborators/5e90460c8b2c22246a226a12c'
```

---

## Invitations API

### Create

- description: Retrieves all invitations to projects
- request: `GET /api/invitations`
- response: 200
  - content-type: `application/json`
  - body: (array of objects)
    - from: ([User](#user)) user of the inviter
    - to: ([User](#user)) user of the invitee
    - projectId: (object) MongoDB Object ID of the project that the user was invited to
    - projectTitle: (string) title of the project that the user was invited to
- response: 403
  - Must be signed in
- response: 500

```
$ curl -X GET
       -H "Content-Type: `application/json`"
       -H "Authorization: `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJfaWQiOiI1ZTkwNDYwNTdhMWIxNDNjYTE4NmE5N2MiLCJ1c2VybmFtZSI6IjEyMyIsImV4cCI6MTU4NzE1ODQ5NywiaWF0IjoxNTg2NTUzNjk3fQ.IgM9Pvtqy8EpbLGSi-E05TWm1Y2sOW-0cd2usn61qoI`
       https://cooperatex.me/api/invitations'
```

---

# WebSocket API Documentation

**Note**: You must be authenticated in order to use the WebSocket API (e.g. `https://cooperatex.me/socket.io/?auth_token=<YOUR JWT GOES HERE>`)

## API Events

- **Common URL Example**: `https://cooperatex.me/socket.io/?auth_token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJfaWQiOiI1ZTkwZWUxZDdhMWIxNDE2YTk4NmE5N2YiLCJ1c2VybmFtZSI6IjEyMzQiLCJleHAiOjE1ODcxNjEyNDUsImlhdCI6MTU4NjU1NjQ0NX0.KOgDIZvM0_KFZ3ZT1uCXbWpitmUK-ft0S7lfrIOmnV4&EIO=3&transport=polling&t=N5c9_8T&sid=2R_CwtPWICsOqoa2AAAM`
- **Note**: `authenticatedUser` is the [User](#user) that is authenticated with the server

* Event Name: `joinUserSession`
  - Arguments: N/A
  - Description: Join a room under [`authenticatedUser`](#user)`._id`

- Event Name: `joinProjectSession`
  - Arguments:
    - projectId: (string) the id of project session to join
  - Description: Join a room under `:projectId`. This event emits a `joinedProjectSession` event with 1 argument ([`authenticatedUser`](#user)). This event also emits `activeUserIdsInProjectSession` event with 1 argument (an array of active user ids).

* Event Name: `leaveProjectSession`
  - Arguments:
    - projectId: (string) the id of project session to leave
  - Description: Leave a room under `:projectId`. This event emits a `leaveProjectSession` event with 1 argument ([`authenticatedUser`](#user))

- Event Name: `projectChange`
  - Arguments:
    - projectId: (string) the id of project to be joined
  - Description: This event emits a `projectChange` event to room `:projectId`

* Event Name: `cursorChange`
  - Arguments:
    - projectId: (string) the id of project session to send the event to
    - data: (object)
      - updatedBy: [User](#user)
      - cursorPos: (object)
        - ch: (number) the character number of the cursor
        - line: (number) the line number of the cursor
  - Description: This event emits a `cursorChange` event to room `:projectId` with 1 argument (`:data`)

- Event Name: `selectionChange`
  - Arguments:
    - projectId: (string) the id of project session to send the event to
    - data: (object)
      - updatedBy: [User](#user)
      - from: (object)
        - ch: (number) the character number of the cursor at the start of the selection
        - line: (number) the line number of the cursor at the start of the selection
      - to: (object)
        - ch: (number) the character number of the cursor at the end of the selection
        - line: (number) the line number of the cursor at the end of the selection
  - Description: This event emits a `selectionChange` event to room `:projectId` with 1 argument (`:data`)

* Event Name: `fileContentsChange`
  - Arguments:
    - projectId: (string) the id of project session to send the event to
    - newContents: (string) new contents of the file
  - Description: This event emits a `fileContentsChange` event to room `:projectId` with 1 argument (`:newContents`)

- Event Name: `invitationChange`
  - Arguments:
    - user: [User](#user)
  - Description: This event emits a `invitationChange` event to room `:user._id`

* Event Name: `collaboratorChange`
  - Arguments:
    - user: [User](#user)
  - Description: This event emits a `collaboratorChange` event to room `:user._id`

- Event Name: `projectAvailabilityChange`
  - Arguments:
    - user: [User](#user)
  - Description: This event emits a `projectAvailabilityChange` event to room `:user._id`
