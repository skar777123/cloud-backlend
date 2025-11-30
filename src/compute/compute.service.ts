import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import axios, { AxiosResponse, AxiosError } from 'axios';
import * as https from 'https';

@Injectable()
export class ComputeService {
  private proxmoxUrl = 'https://192.168.137.10:8006/api2/json';
  private nodeId = 'node1';
  private templateId = 900; // Your Golden Template

  // Authentication Headers (API Token)
  private headers = {
    Authorization: 'PVEAPIToken=root@pam!cloud-backend=be25042e-4f29-4381-9e0a-a45cf50b77c7',
  };

  // Ignore SSL Errors
  private httpsAgent = new https.Agent({ rejectUnauthorized: false });

  // --- Create VM ---
  async createInstance(name: string, cores: number, memory: number, password: string) {
    try {
      // 1. Get Next ID
      const nextIdRes = await axios.get(`${this.proxmoxUrl}/cluster/nextid`, {
        headers: this.headers,
        httpsAgent: this.httpsAgent,
      });
      const newId = nextIdRes.data.data;

      // 2. Clone Template
      const cloneRes = await axios.post(
        `${this.proxmoxUrl}/nodes/${this.nodeId}/lxc/${this.templateId}/clone`,
        { newid: newId, hostname: name, full: cores },
        { headers: this.headers, httpsAgent: this.httpsAgent },
      );
      const upid = cloneRes.data.data;

      // 3. Poll Clone Task Status
      let taskStatus = 'running';
      while (taskStatus !== 'stopped') {
        const statusRes = await axios.get(
          `${this.proxmoxUrl}/nodes/${this.nodeId}/tasks/${upid}/status`,
          { headers: this.headers, httpsAgent: this.httpsAgent },
        );
        taskStatus = statusRes.data.data.status;
        if (taskStatus === 'stopped') break;
        // Wait 1 second before next poll
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      // 4. Update Config with Net0 and Password
      await axios.put(
        `${this.proxmoxUrl}/nodes/${this.nodeId}/lxc/${newId}/config`,
        {
          cores: cores,
          memory: memory,
          password: password,
          net0: `name=eth0,bridge=vmbr0,ip=192.168.137.${newId}/24,gw=192.168.137.1`,
        },
        { headers: this.headers, httpsAgent: this.httpsAgent },
      );

      // 5. Start VM
      await axios.post(
        `${this.proxmoxUrl}/nodes/${this.nodeId}/lxc/${newId}/status/start`,
        {},
        { headers: this.headers, httpsAgent: this.httpsAgent },
      );

      return {
        status: 'success',
        vmId: newId,
        ip: `192.168.137.${newId}`,
        ssh: `ssh root@192.168.137.${newId}`,
      };
    } catch (error) {
      const axiosError = error as AxiosError;
      console.error(axiosError.response?.data);
      throw new HttpException('Failed to create VM', HttpStatus.BAD_REQUEST);
    }
  }

  // --- Update VM Resources ---
  async updateInstance(vmid: number, cores: number, memory: number) {
    try {
      await axios.put(
        `${this.proxmoxUrl}/nodes/${this.nodeId}/lxc/${vmid}/config`,
        { cores, memory },
        { headers: this.headers, httpsAgent: this.httpsAgent },
      );
      return { message: `VM ${vmid} updated successfully` };
    } catch (error) {
      throw new HttpException('Failed to update VM', HttpStatus.BAD_REQUEST);
    }
  }
}
