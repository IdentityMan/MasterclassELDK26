# Lab 1 - Inbound Provisioning

## Lab 1.1 - Create new API-driven Inbound Provisining App in Entra ID

Create new API-driven Inbound Provisioning in Enterprise Applications, provide details and specification here for how to set it up here..

## Lab 1.2 - Attribute Mappings

Attribute mappings to create:

| Entra ID Attribute | API Attribute |
| --- | --- |
| departmentName | urn:ietf:params:scim:schemas:extension:enterprise:2.0:User:organization |
| employeeOrgData.costCenter | urn:ietf:params:scim:schemas:extension:enterprise:2.0:User:costCenter |
| employeeOrgData.division | urn:ietf:params:scim:schemas:extension:enterprise:2.0:User:division |
| employeeType | userType |

## Lab 1.3 - Edit Attribute List and Add Schema

Advanced - Edit Attribute List

Add Schema: (add as strings even though they are dates)
urn:ietf:params:scim:schemas:extension:yourorgnamehere:1.0:User:HireDate
urn:ietf:params:scim:schemas:extension:yourorgnamehere:1.0:User:LeaveDate

Save and Refresh App

Add more Attribute mappings:

employeeHireDate -> urn:ietf:params:scim:schemas:extension:yourorgnamehere:1.0:User:HireDate
employeeLeaveDateTime -> urn:ietf:params:scim:schemas:extension:yourorgnamehere:1.0:User:LeaveDate

## Lab 1.4 - Create App Registration for Client

https://graph.microsoft.com/v1.0/servicePrincipals/{service-principal-object-id}/synchronization/jobs/{job-id}/bulkUpload

Create App Registration:  API-driven provisioning to Microsoft Entra ID - Client

Add Graph Application Permissions:

AuditLog.Read.All
SynchronizationData-User.Upload.OwnedBy

Grant Admin Consent for Organization

Create a Secret Credential, and save the Secret Value and Client ID for App Registration

## Lab 1.5 - Post a SCIM Payload

Provide a template, sample SCIM payload (customize this for lab excercise to not be Elven environment....)

```json
{
    "schemas": [
        "urn:ietf:params:scim:api:messages:2.0:BulkRequest"
    ],
    "Operations": [
        {
            "bulkId": "01daff27-1eb1-401d-a7ac-6c3db87f157b",
            "data": {
                "active": true,
                "addresses": [
                    {
                        "country": "DK",
                        "formatted": "Denmark",
                        "locality": "",
                        "postalCode": "",
                        "primary": true,
                        "region": "",
                        "streetAddress": "",
                        "type": "work"
                    }
                ],
                "displayName": "Holger Danske",
                "emails": [
                    {
                        "primary": true,
                        "type": "work",
                        "value": "holger.danske@elven.no"
                    }
                ],
                "externalId": "holger.danske@elven.no",
                "id": "holger.danske@elven.no",
                "locale": "dk-DK",
                "name": {
                    "familyName": "Danske",
                    "givenName": "Holger"
                },
                "nickName": "holger.danske",
                "phoneNumbers": [
                    {
                        "type": "mobile",
                        "value": "+47 00000000"
                    }
                ],
                "preferredLanguage": "nb-NO",
                "schemas": [
                    "urn:ietf:params:scim:schemas:core:2.0:User",
                    "urn:ietf:params:scim:schemas:extension:enterprise:2.0:User",
                    "urn:ietf:params:scim:schemas:extension:elven:1.0:User"
                ],
                "timezone": "Copenhagen/Denmark",
                "title": "Consultant",
                "urn:ietf:params:scim:schemas:extension:elven:1.0:User": {
                    "HireDate": "2025-3-5T08:00:00+02:00"
                },
                "urn:ietf:params:scim:schemas:extension:elven:1.0:User": {
                    "countryCode": "DK"
                },
                "urn:ietf:params:scim:schemas:extension:enterprise:2.0:User": {
                    "costCenter": "",
                    "department": "ELDK 2026",
                    "division": "",
                    "employeeNumber": "106",
                    "manager": {
                        "$ref": "../Users/flow.streaming@elven.no",
                        "displayName": "flow.streaming@elven.no",
                        "value": "flow.streaming@elven.no"
                    },
                    "organization": "Elven"
                },
                "userName": "holger.danske",
                "userType": "Demo"
            },
            "method": "POST",
            "path": "/Users"
        },
        {
            "bulkId": "b4a94322-bee6-4726-bfcb-49e88331aae7",
            "data": {
                "active": true,
                "addresses": [
                    {
                        "country": "NO",
                        "formatted": "Norway",
                        "locality": "",
                        "postalCode": "",
                        "primary": true,
                        "region": "",
                        "streetAddress": "",
                        "type": "work"
                    }
                ],
                "displayName": "Flow Streaming",
                "emails": [
                    {
                        "primary": true,
                        "type": "work",
                        "value": "flow.streaming@elven.no"
                    }
                ],
                "externalId": "flow.streaming@elven.no",
                "id": "flow.streaming@elven.no",
                "locale": "nb-NO",
                "name": {
                    "familyName": "Streaming",
                    "givenName": "Flow"
                },
                "nickName": "flow.streaming",
                "phoneNumbers": [
                    {
                        "type": "mobile",
                        "value": "+47 12345678"
                    }
                ],
                "preferredLanguage": "nb-NO",
                "schemas": [
                    "urn:ietf:params:scim:schemas:core:2.0:User",
                    "urn:ietf:params:scim:schemas:extension:enterprise:2.0:User",
                    "urn:ietf:params:scim:schemas:extension:csv:1.0:User",
                    "urn:ietf:params:scim:schemas:extension:elven:1.0:User"
                ],
                "timezone": "Norway/Oslo",
                "title": "Manager",
                "urn:ietf:params:scim:schemas:extension:csv:1.0:User": {
                    "HireDate": "2023-08-01T08:00:00+02:00"
                },
                "urn:ietf:params:scim:schemas:extension:elven:1.0:User": {
                    "countryCode": "NO"
                },
                "urn:ietf:params:scim:schemas:extension:enterprise:2.0:User": {
                    "costCenter": "",
                    "department": "ELDK 2026",
                    "division": "",
                    "employeeNumber": "100",
                    "manager": {
                        "$ref": "../Users/",
                        "displayName": "",
                        "value": ""
                    },
                    "organization": "Elven"
                },
                "userName": "flow.streaming",
                "userType": "Demo"
            },
            "method": "POST",
            "path": "/Users"
        }
    ],
    "failOnErrors": null
}
```
