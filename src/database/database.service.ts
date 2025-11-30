import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import axios, { AxiosResponse, AxiosError } from 'axios';
import * as https from 'https';

@Injectable()
export class DatabaseService {
  // CONFIGURATION
  private proxmoxUrl = 'https://192.168.137.10:8006/api2/json';
  private nodeId = 'node1';

  // AUTHENTICATION
  private headers = {
    Authorization:
      'PVEAPIToken=root@pam!cloud-backend=be25042e-4f29-4381-9e0a-a45cf50b77c7',
  };
  private httpsAgent = new https.Agent({ rejectUnauthorized: false });

  // 🗺️ TEMPLATE MAPPING
  private dbTemplates = {
    mariadb: { id: 901, port: 3306, user: 'root' },
    postgres: { id: 902, port: 5432, user: 'postgres' },
    mongodb: { id: 903, port: 27017, user: 'admin' },
    redis: { id: 904, port: 6379, user: 'default' },
  };

  // --- PROVISIONING FUNCTION ---
  async createDatabase(type: string, clientName: string) {
    // 1. Validate DB Type
    const template = this.dbTemplates[type.toLowerCase()];
    if (!template) {
      throw new HttpException(
        'Invalid Database Type. Use: mariadb, postgres, mongodb, redis',
        HttpStatus.BAD_REQUEST,
      );
    }

    try {
      console.log(`[DBaaS] Provisioning ${type} for ${clientName}...`);

      // 2. Get Next ID
      const nextIdRes: AxiosResponse<{ data: number }> = await axios.get(
        `${this.proxmoxUrl}/cluster/nextid`,
        {
          headers: this.headers,
          httpsAgent: this.httpsAgent,
        },
      );
      const newId = nextIdRes.data.data;

      // 3. Clone the Specific Template
      await axios.post(
        `${this.proxmoxUrl}/nodes/${this.nodeId}/lxc/${template.id}/clone`,
        { newid: newId, hostname: `${clientName}-${type}`, full: 1 },
        { headers: this.headers, httpsAgent: this.httpsAgent },
      );

      // 4. Configure Network (Auto-IP based on ID)
      const ipAddress = `192.168.137.${newId}`;
      await axios.put(
        `${this.proxmoxUrl}/nodes/${this.nodeId}/lxc/${newId}/config`,
        {
          // Standard DB specs: 1 Core, 512MB RAM (Adjustable)
          cores: 1,
          memory: 512,
          net0: `name=eth0,bridge=vmbr0,ip=${ipAddress}/24,gw=192.168.137.1`,
        },
        { headers: this.headers, httpsAgent: this.httpsAgent },
      );

      // 5. Start the Database Container
      await axios.post(
        `${this.proxmoxUrl}/nodes/${this.nodeId}/lxc/${newId}/status/start`,
        {},
        { headers: this.headers, httpsAgent: this.httpsAgent },
      );

      // 6. Return Connection Details
      return {
        status: 'success',
        db_type: type,
        instance_id: newId,
        connection_string: `${type}://${template.user}:skar777@${ipAddress}:${template.port}`,
        ip_address: ipAddress,
        port: template.port,
        admin_ssh: `ssh root@${ipAddress}`,
      };
    } catch (error) {
      console.error(
        'DB Provisioning Error:',
        error.response?.data || error.message,
      );
      throw new HttpException(
        'Failed to provision database',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
