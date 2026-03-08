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
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
var client_1 = require("@prisma/client");
var products_1 = require("../../src/data/products");
var prisma = new client_1.PrismaClient();
function main() {
    return __awaiter(this, void 0, void 0, function () {
        var _i, categories_1, cat, exists, _a, products_2, prod, exists;
        var _b, _c, _d, _e, _f, _g, _h, _j;
        return __generator(this, function (_k) {
            switch (_k.label) {
                case 0:
                    console.log('🔄 Démarrage du seed... Insertion des données frontend dans PostgreSQL.');
                    // 1. Inserer les catégories
                    console.log("\n\uD83D\uDCC2 Insertion de ".concat(products_1.categories.length, " cat\u00E9gories..."));
                    _i = 0, categories_1 = products_1.categories;
                    _k.label = 1;
                case 1:
                    if (!(_i < categories_1.length)) return [3 /*break*/, 6];
                    cat = categories_1[_i];
                    return [4 /*yield*/, prisma.category.findUnique({
                            where: { slug: cat.slug }
                        })];
                case 2:
                    exists = _k.sent();
                    if (!!exists) return [3 /*break*/, 4];
                    return [4 /*yield*/, prisma.category.create({
                            data: {
                                name: cat.name,
                                nameAr: cat.nameAr,
                                icon: cat.icon,
                                image: cat.image,
                                slug: cat.slug,
                            }
                        })];
                case 3:
                    _k.sent();
                    console.log("  \u2705 Cat\u00E9gorie cr\u00E9\u00E9e: ".concat(cat.name));
                    return [3 /*break*/, 5];
                case 4:
                    console.log("  \u23E9 Cat\u00E9gorie existante (ignor\u00E9e): ".concat(cat.name));
                    _k.label = 5;
                case 5:
                    _i++;
                    return [3 /*break*/, 1];
                case 6:
                    // 2. Inserer les produits
                    console.log("\n\uD83D\uDECD\uFE0F Insertion de ".concat(products_1.products.length, " produits..."));
                    _a = 0, products_2 = products_1.products;
                    _k.label = 7;
                case 7:
                    if (!(_a < products_2.length)) return [3 /*break*/, 12];
                    prod = products_2[_a];
                    return [4 /*yield*/, prisma.product.findFirst({
                            where: { sku: prod.sku }
                        })];
                case 8:
                    exists = _k.sent();
                    if (!!exists) return [3 /*break*/, 10];
                    return [4 /*yield*/, prisma.product.create({
                            data: {
                                name: prod.name,
                                nameAr: prod.nameAr,
                                price: prod.price,
                                originalPrice: prod.originalPrice,
                                image: prod.image,
                                images: prod.images,
                                rating: prod.rating,
                                reviews: prod.reviews,
                                categorySlug: prod.category,
                                description: prod.description,
                                descriptionAr: prod.descriptionAr,
                                inStock: prod.inStock,
                                sku: prod.sku,
                                tags: (_b = prod.tags) !== null && _b !== void 0 ? _b : [],
                                variants: prod.variants ? JSON.parse(JSON.stringify(prod.variants)) : [],
                                features: (_c = prod.features) !== null && _c !== void 0 ? _c : [],
                                status: prod.status || 'published',
                                isVisible: (_d = prod.isVisible) !== null && _d !== void 0 ? _d : true,
                                isNew: (_e = prod.isNew) !== null && _e !== void 0 ? _e : false,
                                isPopular: (_f = prod.isPopular) !== null && _f !== void 0 ? _f : false,
                                isBestSeller: (_g = prod.isBestSeller) !== null && _g !== void 0 ? _g : false,
                                isFeatured: (_h = prod.isFeatured) !== null && _h !== void 0 ? _h : false,
                                salesCount: (_j = prod.salesCount) !== null && _j !== void 0 ? _j : 0,
                                stock: 100, // default stock assigned
                                createdAt: prod.publishedAt ? new Date(prod.publishedAt) : new Date(),
                            }
                        })];
                case 9:
                    _k.sent();
                    console.log("  \u2705 Produit cr\u00E9\u00E9: ".concat(prod.name));
                    return [3 /*break*/, 11];
                case 10:
                    console.log("  \u23E9 Produit (SKU) existant (ignor\u00E9e): ".concat(prod.name));
                    _k.label = 11;
                case 11:
                    _a++;
                    return [3 /*break*/, 7];
                case 12: return [2 /*return*/];
            }
        });
    });
}
main()
    .catch(function (e) {
    console.error('❌ Erreur durant le script de seed:', e);
    process.exit(1);
})
    .finally(function () { return __awaiter(void 0, void 0, void 0, function () {
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, prisma.$disconnect()];
            case 1:
                _a.sent();
                console.log('\n✅ Script de seed complété ! Tous les faux produits sont maintenant dans la base de données.');
                return [2 /*return*/];
        }
    });
}); });
