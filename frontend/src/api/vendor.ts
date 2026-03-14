import request from '../utils/request';
import type { Vendor, CreateVendorRequest, UpdateVendorRequest } from '../types/vendor';

export async function listVendors(params?: any): Promise<Vendor[]> {
    return request.get('/vendor/list.json', { params });
}

export async function fetchVendorsByIds(ids: number[]): Promise<Vendor[]> {
    return request.post('/vendor/batch.json', { ids });
}

export async function getVendor(id: number): Promise<Vendor> {
    return request.get(`/vendor/${id}`);
}

export async function createVendor(data: CreateVendorRequest): Promise<Vendor> {
    return request.post('/vendor/create.json', data);
}

export async function updateVendor(id: number, data: UpdateVendorRequest): Promise<Vendor> {
    return request.put(`/vendor/${id}`, data);
}

export async function deleteVendor(id: number): Promise<{ success: boolean }> {
    return request.delete(`/vendor/${id}`);
}
