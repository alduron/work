const GRAPH = {
  // ── L2/L3: Component-level nodes ──
  nodes: [
    { id:'cloudfront',       name:'CDN',                    type:'infra' },
    { id:'api-gw',           name:'API Gateway',            type:'service', status:'healthy' },
    { id:'auth-svc',         name:'Auth Service',           type:'service', status:'healthy' },
    { id:'incident-svc',     name:'Incident Service',       type:'service', status:'warning' },
    { id:'bridge-svc',       name:'Bridge Service',         type:'service', status:'degraded' },
    { id:'notif-svc',        name:'Notification Service',   type:'service', status:'healthy' },
    { id:'escalation-eng',   name:'Escalation Engine',      type:'service', status:'healthy' },
    { id:'timeline-svc',     name:'Timeline Service',       type:'service', status:'healthy' },
    { id:'runbook-svc',      name:'Runbook Automator',      type:'service', status:'healthy' },
    { id:'snow-connector',   name:'ServiceNow Connector',   type:'service', status:'healthy' },
    { id:'incident-db',      name:'PostgreSQL',             type:'database', status:'healthy' },
    { id:'redis',            name:'Redis Cache',            type:'database', status:'warning' },
    { id:'elasticsearch',    name:'Search Index',           type:'database', status:'warning' },
    { id:'event-bus',        name:'Message Bus',            type:'infra',   status:'warning' },
    { id:'twilio-api',       name:'Twilio API',             type:'external', status:'degraded' },
    { id:'slack-api',        name:'Slack API',              type:'external' },
    { id:'pagerduty-api',    name:'PagerDuty API',          type:'external' },
    { id:'snow-api',         name:'ServiceNow API',         type:'external' },
    { id:'ses',              name:'Email Service (SES)',     type:'external' },
    { id:'s3',               name:'File Storage (S3)',      type:'external' }
  ],

  // ── L2/L3: Edges with infrastructure paths ──
  edges: [
    // CDN → API Gateway
    { id:'e1', from:'cloudfront', to:'api-gw', path:[
      { name:'CDN Edge Server (IAD)',         type:'Edge Location',       status:'healthy', metrics:{cpu:15,ram:22,net:58,stor:0}},
      { name:'Load Balancer',                 type:'Application LB',      status:'healthy', metrics:{cpu:8,ram:12,net:62,stor:0}},
      { name:'Server Pool',                   type:'Target Group',        status:'healthy', metrics:{cpu:0,ram:0,net:55,stor:0}},
      { name:'Traffic Entry Point',            type:'Ingress Controller',  status:'healthy', metrics:{cpu:18,ram:30,net:50,stor:0}}
    ]},
    // API Gateway → Auth Service
    { id:'e2', from:'api-gw', to:'auth-svc', path:[
      { name:'Gateway Proxy (outbound)',      type:'Network Proxy',       status:'healthy', metrics:{cpu:10,ram:20,net:25,stor:0}},
      { name:'Auth Service Router',           type:'Internal Router',     status:'healthy', metrics:{cpu:0,ram:0,net:22,stor:0}},
      { name:'Auth Proxy (inbound)',          type:'Network Proxy',       status:'healthy', metrics:{cpu:8,ram:18,net:20,stor:0}}
    ]},
    // API Gateway → Incident Service (routed after auth)
    { id:'e3', from:'api-gw', to:'incident-svc', path:[
      { name:'Gateway Proxy (outbound)',      type:'Network Proxy',       status:'healthy', metrics:{cpu:10,ram:20,net:25,stor:0}},
      { name:'Incident Service Router',       type:'Internal Router',     status:'healthy', metrics:{cpu:0,ram:0,net:35,stor:0}},
      { name:'Incident Proxy (inbound)',      type:'Network Proxy',       status:'healthy', metrics:{cpu:12,ram:24,net:32,stor:0}}
    ]},
    // Auth → Redis (session cache)
    { id:'e4', from:'auth-svc', to:'redis', path:[
      { name:'Redis Client',                  type:'Connection Driver',   status:'healthy', metrics:{cpu:3,ram:8,net:12,stor:0}},
      { name:'Cache Router',                  type:'Internal Router',     status:'healthy', metrics:{cpu:0,ram:0,net:10,stor:0}},
      { name:'Cache Monitor',                 type:'Health Monitor',      status:'healthy', metrics:{cpu:4,ram:10,net:8,stor:0}}
    ]},
    // Incident Service → PostgreSQL
    { id:'e5', from:'incident-svc', to:'incident-db', path:[
      { name:'DB Connection Pool (20)',       type:'Connection Pool',     status:'healthy', metrics:{cpu:5,ram:15,net:28,stor:0}},
      { name:'DB Router',                     type:'Internal Router',     status:'healthy', metrics:{cpu:0,ram:0,net:30,stor:0}},
      { name:'Connection Pooler',             type:'Connection Manager',  status:'healthy', metrics:{cpu:12,ram:35,net:32,stor:0}},
      { name:'Primary DB Server',             type:'Database Endpoint',   status:'healthy', metrics:{cpu:0,ram:0,net:40,stor:0}}
    ]},
    // Incident Service → Message Bus
    { id:'e6', from:'incident-svc', to:'event-bus', path:[
      { name:'Event Publisher',               type:'Message Producer',    status:'healthy', metrics:{cpu:10,ram:22,net:42,stor:0}},
      { name:'Message Broker #1',             type:'Message Broker',      status:'warning', metrics:{cpu:38,ram:55,net:65,stor:48}},
      { name:'Incident Events Channel',       type:'Message Channel',     status:'healthy', metrics:{cpu:0,ram:0,net:58,stor:35}}
    ]},
    // Incident Service → Bridge Service
    { id:'e7', from:'incident-svc', to:'bridge-svc', path:[
      { name:'Incident Proxy (outbound)',     type:'Network Proxy',       status:'healthy',  metrics:{cpu:12,ram:24,net:32,stor:0}},
      { name:'Bridge Service Router',         type:'Internal Router',     status:'healthy',  metrics:{cpu:0,ram:0,net:45,stor:0}},
      { name:'Bridge Proxy (inbound)',        type:'Network Proxy',       status:'degraded', metrics:{cpu:72,ram:68,net:55,stor:0}}
    ]},
    // Incident Service → ServiceNow Connector
    { id:'e8', from:'incident-svc', to:'snow-connector', path:[
      { name:'Incident Proxy (outbound)',     type:'Network Proxy',       status:'healthy', metrics:{cpu:12,ram:24,net:32,stor:0}},
      { name:'ServiceNow Router',             type:'Internal Router',     status:'healthy', metrics:{cpu:0,ram:0,net:18,stor:0}},
      { name:'ServiceNow Proxy (inbound)',    type:'Network Proxy',       status:'healthy', metrics:{cpu:6,ram:14,net:15,stor:0}}
    ]},
    // Incident Service → Search Index
    { id:'e9', from:'incident-svc', to:'elasticsearch', path:[
      { name:'Search Client',                 type:'Connection Driver',   status:'healthy', metrics:{cpu:5,ram:12,net:20,stor:0}},
      { name:'Search Load Balancer',           type:'Network LB',          status:'healthy', metrics:{cpu:2,ram:4,net:30,stor:0}},
      { name:'Search Data Server #1',         type:'Data Server',         status:'warning', metrics:{cpu:45,ram:72,net:35,stor:68}}
    ]},
    // Bridge Service → Twilio API (DEGRADED)
    { id:'e10', from:'bridge-svc', to:'twilio-api', path:[
      { name:'Outbound Gateway',              type:'Egress Gateway',      status:'degraded', metrics:{cpu:65,ram:58,net:70,stor:0}},
      { name:'Internet Gateway (AZ-1)',       type:'NAT Gateway',         status:'warning',  metrics:{cpu:0,ram:0,net:78,stor:0}},
      { name:'Twilio Rate Limiter',           type:'Rate Limiter',        status:'degraded', metrics:{cpu:0,ram:0,net:0,stor:0}},
      { name:'Twilio REST Endpoint',          type:'External API',        status:'degraded', metrics:{cpu:0,ram:0,net:0,stor:0}}
    ]},
    // Message Bus → Notification Service
    { id:'e11', from:'event-bus', to:'notif-svc', path:[
      { name:'Notification Processors',       type:'Consumer Group',      status:'healthy', metrics:{cpu:18,ram:30,net:48,stor:0}},
      { name:'Notification Channel',           type:'Message Channel',     status:'healthy', metrics:{cpu:0,ram:0,net:35,stor:22}},
      { name:'Notification Listener',         type:'Message Consumer',    status:'healthy', metrics:{cpu:14,ram:25,net:40,stor:0}}
    ]},
    // Message Bus → Escalation Engine
    { id:'e12', from:'event-bus', to:'escalation-eng', path:[
      { name:'Escalation Processors',         type:'Consumer Group',      status:'healthy', metrics:{cpu:12,ram:22,net:30,stor:0}},
      { name:'Escalation Channel',             type:'Message Channel',     status:'healthy', metrics:{cpu:0,ram:0,net:25,stor:18}},
      { name:'Escalation Listener',           type:'Message Consumer',    status:'healthy', metrics:{cpu:10,ram:20,net:28,stor:0}}
    ]},
    // Message Bus → Timeline Service
    { id:'e13', from:'event-bus', to:'timeline-svc', path:[
      { name:'Timeline Processors',           type:'Consumer Group',      status:'healthy', metrics:{cpu:15,ram:28,net:42,stor:0}},
      { name:'Timeline Channel',               type:'Message Channel',     status:'healthy', metrics:{cpu:0,ram:0,net:38,stor:28}},
      { name:'Timeline Listener',             type:'Message Consumer',    status:'healthy', metrics:{cpu:12,ram:22,net:35,stor:0}}
    ]},
    // Message Bus → Runbook Automator
    { id:'e14', from:'event-bus', to:'runbook-svc', path:[
      { name:'Runbook Processors',             type:'Consumer Group',      status:'healthy', metrics:{cpu:8,ram:18,net:20,stor:0}},
      { name:'Runbook Triggers Channel',       type:'Message Channel',     status:'healthy', metrics:{cpu:0,ram:0,net:15,stor:10}},
      { name:'Runbook Listener',               type:'Message Consumer',    status:'healthy', metrics:{cpu:6,ram:15,net:18,stor:0}}
    ]},
    // Notification → Slack
    { id:'e15', from:'notif-svc', to:'slack-api', path:[
      { name:'Outbound Gateway',              type:'Egress Gateway',      status:'healthy', metrics:{cpu:8,ram:15,net:25,stor:0}},
      { name:'Internet Gateway (AZ-1)',       type:'NAT Gateway',         status:'warning', metrics:{cpu:0,ram:0,net:78,stor:0}},
      { name:'Slack API Endpoint',            type:'External API',        status:'healthy', metrics:{cpu:0,ram:0,net:0,stor:0}}
    ]},
    // Notification → PagerDuty
    { id:'e16', from:'notif-svc', to:'pagerduty-api', path:[
      { name:'Outbound Gateway',              type:'Egress Gateway',      status:'healthy', metrics:{cpu:8,ram:15,net:25,stor:0}},
      { name:'Internet Gateway (AZ-2)',       type:'NAT Gateway',         status:'healthy', metrics:{cpu:0,ram:0,net:42,stor:0}},
      { name:'PagerDuty API Endpoint',        type:'External API',        status:'healthy', metrics:{cpu:0,ram:0,net:0,stor:0}}
    ]},
    // Notification → Email
    { id:'e17', from:'notif-svc', to:'ses', path:[
      { name:'Email Client',                  type:'Service Client',      status:'healthy', metrics:{cpu:3,ram:8,net:15,stor:0}},
      { name:'Email Service Endpoint',        type:'External API',        status:'healthy', metrics:{cpu:0,ram:0,net:0,stor:0}}
    ]},
    // ServiceNow Connector → ServiceNow API
    { id:'e18', from:'snow-connector', to:'snow-api', path:[
      { name:'Outbound Gateway',              type:'Egress Gateway',      status:'healthy', metrics:{cpu:6,ram:12,net:18,stor:0}},
      { name:'Internet Gateway (AZ-1)',       type:'NAT Gateway',         status:'warning', metrics:{cpu:0,ram:0,net:78,stor:0}},
      { name:'ServiceNow API Endpoint',       type:'External API',        status:'healthy', metrics:{cpu:0,ram:0,net:0,stor:0}}
    ]},
    // Timeline → File Storage
    { id:'e19', from:'timeline-svc', to:'s3', path:[
      { name:'Storage Client',                type:'Service Client',      status:'healthy', metrics:{cpu:2,ram:6,net:20,stor:0}},
      { name:'Storage Endpoint',              type:'External API',        status:'healthy', metrics:{cpu:0,ram:0,net:0,stor:0}}
    ]},
    // Escalation Engine → PostgreSQL (reads on-call schedules)
    { id:'e20', from:'escalation-eng', to:'incident-db', path:[
      { name:'DB Connection Pool (5)',        type:'Connection Pool',     status:'healthy', metrics:{cpu:3,ram:8,net:10,stor:0}},
      { name:'DB Router',                     type:'Internal Router',     status:'healthy', metrics:{cpu:0,ram:0,net:30,stor:0}},
      { name:'Read Replica Server',           type:'Database Endpoint',   status:'healthy', metrics:{cpu:0,ram:0,net:15,stor:0}}
    ]},
    // Bridge Service → Message Bus (reports bridge status events)
    { id:'e22', from:'bridge-svc', to:'event-bus', path:[
      { name:'Bridge Event Publisher',        type:'Message Producer',    status:'degraded', metrics:{cpu:58,ram:48,net:35,stor:0}},
      { name:'Message Broker #2',             type:'Message Broker',      status:'warning',  metrics:{cpu:35,ram:52,net:60,stor:45}},
      { name:'Bridge Events Channel',         type:'Message Channel',     status:'warning',  metrics:{cpu:0,ram:0,net:42,stor:20}}
    ]},
    // Escalation Engine → Message Bus (publishes escalation actions)
    { id:'e23', from:'escalation-eng', to:'event-bus', path:[
      { name:'Escalation Publisher',          type:'Message Producer',    status:'healthy', metrics:{cpu:8,ram:15,net:18,stor:0}},
      { name:'Message Broker #3',             type:'Message Broker',      status:'healthy', metrics:{cpu:32,ram:50,net:58,stor:42}},
      { name:'Escalation Actions Channel',    type:'Message Channel',     status:'healthy', metrics:{cpu:0,ram:0,net:12,stor:8}}
    ]},
    // Notification → Twilio (SMS notifications)
    { id:'e24', from:'notif-svc', to:'twilio-api', path:[
      { name:'Outbound Gateway',              type:'Egress Gateway',      status:'healthy',  metrics:{cpu:8,ram:15,net:25,stor:0}},
      { name:'Internet Gateway (AZ-1)',       type:'NAT Gateway',         status:'warning',  metrics:{cpu:0,ram:0,net:78,stor:0}},
      { name:'Twilio Rate Limiter',           type:'Rate Limiter',        status:'degraded', metrics:{cpu:0,ram:0,net:0,stor:0}},
      { name:'Twilio REST Endpoint',          type:'External API',        status:'degraded', metrics:{cpu:0,ram:0,net:0,stor:0}}
    ]},
    // Timeline → PostgreSQL
    { id:'e21', from:'timeline-svc', to:'incident-db', path:[
      { name:'DB Connection Pool (10)',       type:'Connection Pool',     status:'healthy', metrics:{cpu:4,ram:10,net:15,stor:0}},
      { name:'DB Router',                     type:'Internal Router',     status:'healthy', metrics:{cpu:0,ram:0,net:30,stor:0}},
      { name:'Primary DB Server',             type:'Database Endpoint',   status:'healthy', metrics:{cpu:0,ram:0,net:40,stor:0}}
    ]}
  ],

  // ── Expandable detail nodes ──
  details: {
    'api-gw': [
      { id:'gw-d1', name:'Environment: Production',     type:'namespace' },
      { id:'gw-d2', name:'Instance: gateway-8f4a',      type:'pod', status:'healthy',  metrics:{cpu:22,ram:40,net:55,stor:8}},
      { id:'gw-d3', name:'Instance: gateway-2b7c',      type:'pod', status:'healthy',  metrics:{cpu:18,ram:38,net:52,stor:8}},
      { id:'gw-d4', name:'Rate Limit: 1000 req/min',    type:'config' }
    ],
    'auth-svc': [
      { id:'auth-d1', name:'Instance: auth-a91f',       type:'pod', status:'healthy', metrics:{cpu:18,ram:35,net:22,stor:5}},
      { id:'auth-d2', name:'Instance: auth-c42d',       type:'pod', status:'healthy', metrics:{cpu:15,ram:32,net:20,stor:5}},
      { id:'auth-d3', name:'Provider: Auth0',            type:'config' },
      { id:'auth-d4', name:'Auth Keys: cached (1 hour)', type:'config' }
    ],
    'incident-svc': [
      { id:'inc-d1', name:'Server: 10.0.12.45',         type:'host' },
      { id:'inc-d2', name:'Instance: incident-7a3b',    type:'pod', status:'warning',  metrics:{cpu:42,ram:58,net:48,stor:12}},
      { id:'inc-d3', name:'Instance: incident-9e1f',    type:'pod', status:'warning',  metrics:{cpu:38,ram:55,net:45,stor:12}},
      { id:'inc-d4', name:'Instance: incident-4c8d',    type:'pod', status:'warning',  metrics:{cpu:45,ram:60,net:50,stor:12}},
      { id:'inc-d5', name:'Autoscaler: 3 of 8 max',     type:'autoscaler' },
      { id:'inc-d6', name:'Workflows: 6 active',        type:'runtime' }
    ],
    'bridge-svc': [
      { id:'br-d1', name:'Server: 10.0.14.78',          type:'host' },
      { id:'br-d2', name:'Instance: bridge-f2a1',       type:'pod', status:'degraded', metrics:{cpu:88,ram:85,net:72,stor:18}},
      { id:'br-d3', name:'Instance: bridge-d5c3',       type:'pod', status:'degraded', metrics:{cpu:82,ram:80,net:68,stor:18}},
      { id:'br-d4', name:'Instance: bridge-b8e7',       type:'pod', status:'healthy',  metrics:{cpu:35,ram:42,net:30,stor:10}},
      { id:'br-d5', name:'Twilio Breaker: HALF-OPEN',   type:'circuit-breaker', status:'degraded' },
      { id:'br-d6', name:'Pending Bridges: 847',        type:'queue', status:'degraded' }
    ],
    'notif-svc': [
      { id:'nf-d1', name:'Instance: notif-e7f2',        type:'pod', status:'healthy', metrics:{cpu:28,ram:42,net:55,stor:8}},
      { id:'nf-d2', name:'Instance: notif-a3b8',        type:'pod', status:'healthy', metrics:{cpu:25,ram:40,net:52,stor:8}},
      { id:'nf-d3', name:'Templates: 12 active',        type:'config' },
      { id:'nf-d4', name:'Failed Messages: 0',          type:'queue', status:'healthy' }
    ],
    'escalation-eng': [
      { id:'esc-d1', name:'Instance: escalation-a1c2',  type:'pod', status:'healthy', metrics:{cpu:20,ram:35,net:18,stor:5}},
      { id:'esc-d2', name:'Policies: 24 active rules',  type:'config' },
      { id:'esc-d3', name:'On-Call: 8 schedules loaded', type:'runtime' }
    ],
    'timeline-svc': [
      { id:'tl-d1', name:'Instance: timeline-b4d6',     type:'pod', status:'healthy', metrics:{cpu:22,ram:38,net:42,stor:15}},
      { id:'tl-d2', name:'Instance: timeline-f8a2',     type:'pod', status:'healthy', metrics:{cpu:20,ram:35,net:40,stor:15}},
      { id:'tl-d3', name:'Event Buffer: 12 queued',     type:'queue', status:'healthy' }
    ],
    'runbook-svc': [
      { id:'rb-d1', name:'Instance: runbook-c3e5',      type:'pod', status:'healthy', metrics:{cpu:15,ram:28,net:12,stor:8}},
      { id:'rb-d2', name:'Playbooks: 18 loaded',        type:'config' },
      { id:'rb-d3', name:'Running: 3 active',           type:'runtime', status:'healthy', metrics:{cpu:40,ram:55,net:20,stor:0}}
    ],
    'snow-connector': [
      { id:'sn-d1', name:'Instance: snow-conn-a2b4',    type:'pod', status:'healthy', metrics:{cpu:12,ram:25,net:18,stor:5}},
      { id:'sn-d2', name:'Sync: bi-directional',        type:'config' },
      { id:'sn-d3', name:'Pending Syncs: 3',            type:'queue', status:'healthy' }
    ],
    'incident-db': [
      { id:'db-d1', name:'Primary Server',              type:'rds', status:'healthy', metrics:{cpu:35,ram:68,net:42,stor:55}},
      { id:'db-d2', name:'Read Replica',                type:'rds', status:'healthy', metrics:{cpu:18,ram:45,net:25,stor:55}},
      { id:'db-d3', name:'Storage: 120 / 500 GB',       type:'ebs', status:'healthy', metrics:{cpu:0,ram:0,net:0,stor:24}},
      { id:'db-d4', name:'Table: incidents',             type:'table', meta:'284K rows' },
      { id:'db-d5', name:'Table: timeline_events',       type:'table', meta:'12.8M rows' },
      { id:'db-d6', name:'Table: on_call_schedules',     type:'table', meta:'1.2K rows' },
      { id:'db-d7', name:'Table: escalation_policies',   type:'table', meta:'340 rows' },
      { id:'db-d8', name:'Table: bridge_sessions',       type:'table', meta:'95K rows' }
    ],
    'redis': [
      { id:'rd-d1', name:'Primary Node',                type:'redis', status:'warning', metrics:{cpu:18,ram:62,net:35,stor:28}},
      { id:'rd-d2', name:'Replica #1',                  type:'redis', status:'healthy', metrics:{cpu:12,ram:58,net:30,stor:28}},
      { id:'rd-d3', name:'Replica #2',                  type:'redis', status:'healthy', metrics:{cpu:10,ram:55,net:28,stor:28}},
      { id:'rd-d4', name:'Sessions: 42K tokens',        type:'data', meta:'Expire: 24h' }
    ],
    'elasticsearch': [
      { id:'es-d1', name:'Data Server #1',              type:'es-node', status:'warning', metrics:{cpu:45,ram:72,net:35,stor:68}},
      { id:'es-d2', name:'Data Server #2',              type:'es-node', status:'warning', metrics:{cpu:42,ram:70,net:32,stor:65}},
      { id:'es-d3', name:'Index: incidents (Feb)',       type:'index', meta:'18K docs' },
      { id:'es-d4', name:'Index: audit-logs (Feb)',      type:'index', meta:'2.1M docs' }
    ],
    'event-bus': [
      { id:'eb-d1', name:'Broker #1',                   type:'msk', status:'warning', metrics:{cpu:38,ram:55,net:65,stor:48}},
      { id:'eb-d2', name:'Broker #2',                   type:'msk', status:'warning', metrics:{cpu:35,ram:52,net:60,stor:45}},
      { id:'eb-d3', name:'Broker #3',                   type:'msk', status:'healthy', metrics:{cpu:32,ram:50,net:58,stor:42}},
      { id:'eb-d4', name:'Channels: 6 active',          type:'config' },
      { id:'eb-d5', name:'Partitions: 30 total',        type:'config' },
      { id:'eb-d6', name:'Message Lag: 12',             type:'metric', status:'healthy' }
    ]
  },

  // ── L1: Services that REQUIRE IncidentHub to function ──
  upstream: [
    { id:'u1', name:'Web Users',             icon:'WB', color:'#1565c0' },
    { id:'u2', name:'Mobile App',            icon:'MB', color:'#2e7d32' },
    { id:'u3', name:'Slack Bot',             icon:'SB', color:'#611f69' },
    { id:'u4', name:'Amilia',                icon:'AM', color:'#e91e63' },
    { id:'u5', name:'SDK Clients',           icon:'CL', color:'#546e7a' }
  ],

  // ── L1: Services IncidentHub depends on ──
  downstream: [
    { id:'d1', name:'Twilio API',            l2id:'twilio-api' },
    { id:'d2', name:'Slack API',             l2id:'slack-api' },
    { id:'d3', name:'PagerDuty API',         l2id:'pagerduty-api' },
    { id:'d4', name:'ServiceNow API',        l2id:'snow-api' },
    { id:'d5', name:'Email Service (SES)',    l2id:'ses' },
    { id:'d6', name:'File Storage (S3)',     l2id:'s3' },
    { id:'d7', name:'Message Bus',           l2id:'event-bus' },
    { id:'d8', name:'PostgreSQL',            l2id:'incident-db' },
    { id:'d9', name:'Redis Cache',           l2id:'redis' },
    { id:'d10', name:'Search Index',         l2id:'elasticsearch' }
  ]
};
