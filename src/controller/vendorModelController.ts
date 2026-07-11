import { Context } from "hono";
import { SgVendor } from "../model/sgVendor";
import { SgVendorModel } from "../model/sgVendorModel";
import vendorService from "../service/vendorService";
import customError from "../util/customError";
import { ApiFormat } from "../constants";


function serializeVendorModel(m: SgVendorModel) {
    return {
        ...m.toData(),
        allowed_formats: m.getAllowedFormats(),
    };
}


async function listVendorModels(c: Context) {
    const vendorId = parseInt(c.req.param("id"), 10);
    if (isNaN(vendorId)) {
        throw new customError.AppError("Invalid ID format");
    }

    const models = await SgVendorModel.query()
        .where("vendor_id", vendorId)
        .orderBy("model_id", "asc")
        .get();

    return c.json(models.map(serializeVendorModel));
}


async function fetchVendorModels(c: Context) {
    const vendorId = parseInt(c.req.param("id"), 10);
    if (isNaN(vendorId)) {
        throw new customError.AppError("Invalid ID format");
    }

    const vendor = await SgVendor.query().find(vendorId);
    if (!vendor) {
        throw new customError.NotFoundError("Vendor not found");
    }

    const models = await vendorService.fetchUpstreamModels(vendor);
    return c.json({ models });
}


async function syncVendorModels(c: Context) {
    const vendorId = parseInt(c.req.param("id"), 10);
    if (isNaN(vendorId)) {
        throw new customError.AppError("Invalid ID format");
    }

    const vendor = await SgVendor.query().find(vendorId);
    if (!vendor) {
        throw new customError.NotFoundError("Vendor not found");
    }

    const body = await c.req.json();
    const { model_ids } = body;

    if (!Array.isArray(model_ids)) {
        throw new customError.AppError("model_ids must be an array");
    }

    // 删除该 vendor 下所有旧记录，重新插入选中的
    await SgVendorModel.query().where("vendor_id", vendorId).delete();

    if (model_ids.length > 0) {
        for (const modelId of model_ids) {
            await SgVendorModel.query().create({
                vendor_id: vendorId,
                model_id: modelId,
            });
        }
    }

    const updated = await SgVendorModel.query()
        .where("vendor_id", vendorId)
        .orderBy("model_id", "asc")
        .get();

    return c.json(updated.map(serializeVendorModel));
}


async function addVendorModel(c: Context) {
    const vendorId = parseInt(c.req.param("id"), 10);
    if (isNaN(vendorId)) {
        throw new customError.AppError("Invalid ID format");
    }

    const vendor = await SgVendor.query().find(vendorId);
    if (!vendor) {
        throw new customError.NotFoundError("Vendor not found");
    }

    const body = await c.req.json();
    const { model_id } = body;

    if (!model_id || typeof model_id !== "string" || !model_id.trim()) {
        throw new customError.AppError("model_id is required");
    }

    const trimmed = model_id.trim();

    const existing = await SgVendorModel.query()
        .where("vendor_id", vendorId)
        .where("model_id", trimmed)
        .first();

    if (existing) {
        throw new customError.AppError("Model already exists", 409);
    }

    const record = await SgVendorModel.query().create({
        vendor_id: vendorId,
        model_id: trimmed,
    });

    return c.json(serializeVendorModel(record));
}


async function getVendorModelsByIds(c: Context) {
    const body = await c.req.json();
    const ids = body.ids;

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
        return c.json([]);
    }

    const idList = ids.map((id: unknown) => parseInt(String(id), 10)).filter((id: number) => !isNaN(id));
    if (idList.length === 0) {
        return c.json([]);
    }

    const models = await SgVendorModel.query().whereIn("id", idList).get();
    return c.json(models.map(serializeVendorModel));
}


async function updateVendorModel(c: Context) {
    const vendorId = parseInt(c.req.param("id"), 10);
    const recordId = parseInt(c.req.param("modelId"), 10);

    if (isNaN(vendorId) || isNaN(recordId)) {
        throw new customError.AppError("Invalid ID format");
    }

    const record = await SgVendorModel.query()
        .where("id", recordId)
        .where("vendor_id", vendorId)
        .first();

    if (!record) {
        throw new customError.NotFoundError("Vendor model not found");
    }

    const body = await c.req.json();
    const { allowed_formats } = body;

    let allowedFormatsJson: string | null = null;
    if (Array.isArray(allowed_formats) && allowed_formats.length > 0) {
        const validFormats = Object.values(ApiFormat);
        const filtered = allowed_formats.filter((f: unknown) => validFormats.includes(f as ApiFormat));
        allowedFormatsJson = filtered.length > 0 ? JSON.stringify(filtered) : null;
    }

    await SgVendorModel.query().where("id", recordId).update({ allowed_formats: allowedFormatsJson });

    const updated = await SgVendorModel.query().find(recordId);
    return c.json(serializeVendorModel(updated!));
}


async function deleteVendorModel(c: Context) {
    const vendorId = parseInt(c.req.param("id"), 10);
    const recordId = parseInt(c.req.param("modelId"), 10);

    if (isNaN(vendorId) || isNaN(recordId)) {
        throw new customError.AppError("Invalid ID format");
    }

    const record = await SgVendorModel.query()
        .where("id", recordId)
        .where("vendor_id", vendorId)
        .first();

    if (!record) {
        throw new customError.NotFoundError("Vendor model not found");
    }

    await SgVendorModel.query().where("id", recordId).delete();

    return c.json({ success: true });
}


export default {
    listVendorModels,
    fetchVendorModels,
    syncVendorModels,
    addVendorModel,
    updateVendorModel,
    deleteVendorModel,
    getVendorModelsByIds,
};
