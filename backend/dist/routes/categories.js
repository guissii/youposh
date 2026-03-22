"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const client_1 = require("@prisma/client");
const cache_1 = require("../utils/cache");
const router = (0, express_1.Router)();
const prisma = new client_1.PrismaClient();
function slugify(input) {
    const s = String(input !== null && input !== void 0 ? input : '').trim().toLowerCase();
    return s
        .normalize('NFKD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
}
const categoryInclude = {
    _count: { select: { products: true } },
    attributes: {
        orderBy: { sortOrder: 'asc' },
        include: {
            values: { orderBy: { sortOrder: 'asc' } },
        },
    },
};
// GET all categories
router.get('/', (0, cache_1.cacheMiddleware)(60), (_req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const categories = yield prisma.category.findMany({
            include: categoryInclude,
        });
        res.json(categories);
    }
    catch (error) {
        console.error('Error fetching categories:', error);
        res.status(500).json({ error: 'Failed to fetch categories' });
    }
}));
// GET single category (with attributes)
router.get('/:id', (0, cache_1.cacheMiddleware)(60), (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const id = parseInt(String(req.params.id));
        const category = yield prisma.category.findUnique({
            where: { id },
            include: categoryInclude,
        });
        if (!category)
            return res.status(404).json({ error: 'Category not found' });
        res.json(category);
    }
    catch (error) {
        console.error('Error fetching category:', error);
        res.status(500).json({ error: 'Failed to fetch category' });
    }
}));
// POST create category
router.post('/', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const _b = (_a = req.body) !== null && _a !== void 0 ? _a : {}, { attributes } = _b, categoryData = __rest(_b, ["attributes"]);
        const created = yield prisma.$transaction((tx) => __awaiter(void 0, void 0, void 0, function* () {
            var _a, _b, _c;
            const category = yield tx.category.create({ data: categoryData });
            if (Array.isArray(attributes) && attributes.length) {
                for (let i = 0; i < attributes.length; i++) {
                    const a = (_a = attributes[i]) !== null && _a !== void 0 ? _a : {};
                    const code = slugify(a.code || a.name) || `attr-${i + 1}`;
                    const globalAttributeId = Number.isFinite(Number(a.globalAttributeId)) ? Number(a.globalAttributeId) : undefined;
                    yield tx.categoryAttribute.create({
                        data: {
                            categoryId: category.id,
                            globalAttributeId,
                            code,
                            name: String((_b = a.name) !== null && _b !== void 0 ? _b : ''),
                            nameAr: String((_c = a.nameAr) !== null && _c !== void 0 ? _c : ''),
                            isMulti: a.isMulti !== false,
                            sortOrder: Number.isFinite(Number(a.sortOrder)) ? Number(a.sortOrder) : i,
                            values: {
                                create: Array.isArray(a.values)
                                    ? a.values.map((v, j) => {
                                        var _a, _b;
                                        return ({
                                            globalValueId: Number.isFinite(Number(v.globalValueId)) ? Number(v.globalValueId) : undefined,
                                            value: String((_a = v.value) !== null && _a !== void 0 ? _a : ''),
                                            valueAr: String((_b = v.valueAr) !== null && _b !== void 0 ? _b : ''),
                                            sortOrder: Number.isFinite(Number(v.sortOrder)) ? Number(v.sortOrder) : j,
                                        });
                                    }).filter((v) => v.value.trim().length > 0)
                                    : [],
                            },
                        },
                    });
                }
            }
            return tx.category.findUnique({
                where: { id: category.id },
                include: categoryInclude,
            });
        }));
        (0, cache_1.clearCache)();
        res.status(201).json(created);
    }
    catch (error) {
        console.error('Error creating category:', error);
        res.status(500).json({ error: 'Failed to create category' });
    }
}));
// PUT update category
router.put('/:id', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const id = parseInt(String(req.params.id));
        const _b = (_a = req.body) !== null && _a !== void 0 ? _a : {}, { attributes } = _b, categoryData = __rest(_b, ["attributes"]);
        const updated = yield prisma.$transaction((tx) => __awaiter(void 0, void 0, void 0, function* () {
            var _a, _b, _c, _d, _e, _f, _g, _h, _j;
            yield tx.category.update({
                where: { id },
                data: categoryData,
            });
            if (Array.isArray(attributes)) {
                const existingAttrs = yield tx.categoryAttribute.findMany({
                    where: { categoryId: id },
                    include: { values: true },
                });
                const keepAttrIds = new Set();
                for (let i = 0; i < attributes.length; i++) {
                    const a = (_a = attributes[i]) !== null && _a !== void 0 ? _a : {};
                    const code = slugify(a.code || a.name) || `attr-${i + 1}`;
                    const globalAttributeId = Number.isFinite(Number(a.globalAttributeId)) ? Number(a.globalAttributeId) : undefined;
                    const attrIdFromPayload = Number.isFinite(Number(a.id)) ? Number(a.id) : undefined;
                    const existingSameCode = existingAttrs.find(x => x.code === code);
                    const targetAttrId = attrIdFromPayload !== null && attrIdFromPayload !== void 0 ? attrIdFromPayload : existingSameCode === null || existingSameCode === void 0 ? void 0 : existingSameCode.id;
                    const attr = targetAttrId
                        ? yield tx.categoryAttribute.update({
                            where: { id: targetAttrId },
                            data: {
                                globalAttributeId,
                                code,
                                name: String((_b = a.name) !== null && _b !== void 0 ? _b : ''),
                                nameAr: String((_c = a.nameAr) !== null && _c !== void 0 ? _c : ''),
                                isMulti: a.isMulti !== false,
                                sortOrder: Number.isFinite(Number(a.sortOrder)) ? Number(a.sortOrder) : i,
                            },
                        })
                        : yield tx.categoryAttribute.create({
                            data: {
                                categoryId: id,
                                globalAttributeId,
                                code,
                                name: String((_d = a.name) !== null && _d !== void 0 ? _d : ''),
                                nameAr: String((_e = a.nameAr) !== null && _e !== void 0 ? _e : ''),
                                isMulti: a.isMulti !== false,
                                sortOrder: Number.isFinite(Number(a.sortOrder)) ? Number(a.sortOrder) : i,
                            },
                        });
                    keepAttrIds.add(attr.id);
                    const keepValueIds = new Set();
                    if (Array.isArray(a.values)) {
                        for (let j = 0; j < a.values.length; j++) {
                            const v = (_f = a.values[j]) !== null && _f !== void 0 ? _f : {};
                            const valueIdFromPayload = Number.isFinite(Number(v.id)) ? Number(v.id) : undefined;
                            const valueStr = String((_g = v.value) !== null && _g !== void 0 ? _g : '').trim();
                            if (!valueStr)
                                continue;
                            const val = valueIdFromPayload
                                ? yield tx.categoryAttributeValue.update({
                                    where: { id: valueIdFromPayload },
                                    data: {
                                        globalValueId: Number.isFinite(Number(v.globalValueId)) ? Number(v.globalValueId) : undefined,
                                        value: valueStr,
                                        valueAr: String((_h = v.valueAr) !== null && _h !== void 0 ? _h : ''),
                                        sortOrder: Number.isFinite(Number(v.sortOrder)) ? Number(v.sortOrder) : j,
                                    },
                                })
                                : yield tx.categoryAttributeValue.create({
                                    data: {
                                        attributeId: attr.id,
                                        globalValueId: Number.isFinite(Number(v.globalValueId)) ? Number(v.globalValueId) : undefined,
                                        value: valueStr,
                                        valueAr: String((_j = v.valueAr) !== null && _j !== void 0 ? _j : ''),
                                        sortOrder: Number.isFinite(Number(v.sortOrder)) ? Number(v.sortOrder) : j,
                                    },
                                });
                            keepValueIds.add(val.id);
                        }
                    }
                    yield tx.categoryAttributeValue.deleteMany({
                        where: Object.assign({ attributeId: attr.id }, (keepValueIds.size ? { id: { notIn: [...keepValueIds] } } : {})),
                    });
                }
                yield tx.categoryAttribute.deleteMany({
                    where: Object.assign({ categoryId: id }, (keepAttrIds.size ? { id: { notIn: [...keepAttrIds] } } : {})),
                });
            }
            return tx.category.findUnique({
                where: { id },
                include: categoryInclude,
            });
        }));
        (0, cache_1.clearCache)();
        res.json(updated);
    }
    catch (error) {
        console.error('Error updating category:', error);
        res.status(500).json({ error: 'Failed to update category' });
    }
}));
// DELETE category
router.delete('/:id', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        yield prisma.category.delete({
            where: { id: parseInt(String(req.params.id)) },
        });
        (0, cache_1.clearCache)();
        res.json({ message: 'Category deleted' });
    }
    catch (error) {
        console.error('Error deleting category:', error);
        res.status(500).json({ error: 'Failed to delete category' });
    }
}));
exports.default = router;
