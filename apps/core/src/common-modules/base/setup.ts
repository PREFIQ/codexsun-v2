import { CountryService } from "../countries/service.js";
import { CountryRepository } from "../countries/repository.js";
import { StateService } from "../states/service.js";
import { StateRepository } from "../states/repository.js";
import { DistrictService } from "../districts/service.js";
import { DistrictRepository } from "../districts/repository.js";
import { CityService } from "../cities/service.js";
import { CityRepository } from "../cities/repository.js";
import { PincodeService } from "../pincodes/service.js";
import { PincodeRepository } from "../pincodes/repository.js";
import { ContactGroupService } from "../contact-groups/service.js";
import { ContactGroupRepository } from "../contact-groups/repository.js";
import { ContactTypeService } from "../contact-types/service.js";
import { ContactTypeRepository } from "../contact-types/repository.js";
import { AddressTypeService } from "../address-types/service.js";
import { AddressTypeRepository } from "../address-types/repository.js";
import { BankNameService } from "../bank-names/service.js";
import { BankNameRepository } from "../bank-names/repository.js";
import { BankAccountTypeService } from "../bank-account-types/service.js";
import { BankAccountTypeRepository } from "../bank-account-types/repository.js";
import { ProductGroupService } from "../product-groups/service.js";
import { ProductGroupRepository } from "../product-groups/repository.js";
import { ProductCategoryService } from "../product-categories/service.js";
import { ProductCategoryRepository } from "../product-categories/repository.js";
import { ProductTypeService } from "../product-types/service.js";
import { ProductTypeRepository } from "../product-types/repository.js";
import { UnitService } from "../units/service.js";
import { UnitRepository } from "../units/repository.js";
import { HsnCodeService } from "../hsn-codes/service.js";
import { HsnCodeRepository } from "../hsn-codes/repository.js";
import { TaxService } from "../taxes/service.js";
import { TaxRepository } from "../taxes/repository.js";
import { BrandService } from "../brands/service.js";
import { BrandRepository } from "../brands/repository.js";
import { ColourService } from "../colours/service.js";
import { ColourRepository } from "../colours/repository.js";
import { SizeService } from "../sizes/service.js";
import { SizeRepository } from "../sizes/repository.js";
import { StyleService } from "../styles/service.js";
import { StyleRepository } from "../styles/repository.js";
import { OrderTypeService } from "../order-types/service.js";
import { OrderTypeRepository } from "../order-types/repository.js";
import { TransportService } from "../transports/service.js";
import { TransportRepository } from "../transports/repository.js";
import { WarehouseService } from "../warehouses/service.js";
import { WarehouseRepository } from "../warehouses/repository.js";
import { DestinationService } from "../destinations/service.js";
import { DestinationRepository } from "../destinations/repository.js";
import { StockRejectionTypeService } from "../stock-rejection-types/service.js";
import { StockRejectionTypeRepository } from "../stock-rejection-types/repository.js";
import { CurrencyService } from "../currencies/service.js";
import { CurrencyRepository } from "../currencies/repository.js";
import { PriorityService } from "../priorities/service.js";
import { PriorityRepository } from "../priorities/repository.js";
import { PaymentTermService } from "../payment-terms/service.js";
import { PaymentTermRepository } from "../payment-terms/repository.js";
import { AccountingYearService } from "../accounting-year/service.js";
import { AccountingYearRepository } from "../accounting-year/repository.js";
import { MonthService } from "../months/service.js";
import { MonthRepository } from "../months/repository.js";
import { SalesAccountTypeService } from "../sales-account-types/service.js";
import { SalesAccountTypeRepository } from "../sales-account-types/repository.js";
import type { CommonModuleServiceMap, CommonModuleDefinition } from "./service-types.js";
import { GenericCommonModuleService } from "./generic-service.js";

const genericCommonDefinitions: CommonModuleDefinition[] = [
  { key: "address-book", label: "Address Book" },
  { key: "contact-emails", label: "Contact Emails" },
  { key: "contact-phones", label: "Contact Phones" },
  { key: "contact-social-links", label: "Contact Social Links" },
  { key: "contact-bank-accounts", label: "Contact Bank Accounts" },
  { key: "contact-gst-details", label: "Contact GST Details" },
  { key: "company-logos", label: "Company Logos" },
  { key: "company-emails", label: "Company Emails" },
  { key: "company-phones", label: "Company Phones" },
  { key: "company-social-links", label: "Company Social Links" },
  { key: "company-bank-accounts", label: "Company Bank Accounts" },
  { key: "work-orders", label: "Work Orders" },
  { key: "sales", label: "Sales" },
  { key: "quotations", label: "Quotations" },
  { key: "purchases", label: "Purchases" },
  { key: "receipts", label: "Receipts" },
  { key: "payments", label: "Payments" },
  { key: "purchase-receipts", label: "Purchase Receipts" },
  { key: "delivery-notes", label: "Delivery Notes" },
  { key: "stock-ledger", label: "Stock Ledger" },
  { key: "mail", label: "Mail" },
  { key: "tasks", label: "Tasks" },
  { key: "media-assets", label: "Media Assets" },
  { key: "site-sliders", label: "Site Sliders" },
  { key: "blog", label: "Blog" },
  { key: "company-settings", label: "Company Settings" },
  { key: "document-settings", label: "Document Settings" },
];

function genericCommonServices(): CommonModuleServiceMap {
  return Object.fromEntries(
    genericCommonDefinitions.map((definition) => [definition.key, new GenericCommonModuleService(definition.label)])
  );
}

export function createAllCommonModuleServices(): CommonModuleServiceMap {
  return {
    countries: new CountryService(new CountryRepository()) as any,
    states: new StateService(new StateRepository()) as any,
    districts: new DistrictService(new DistrictRepository()) as any,
    cities: new CityService(new CityRepository()) as any,
    pincodes: new PincodeService(new PincodeRepository()) as any,
    "contact-groups": new ContactGroupService(new ContactGroupRepository()) as any,
    "contact-types": new ContactTypeService(new ContactTypeRepository()) as any,
    "address-types": new AddressTypeService(new AddressTypeRepository()) as any,
    "bank-names": new BankNameService(new BankNameRepository()) as any,
    "bank-account-types": new BankAccountTypeService(new BankAccountTypeRepository()) as any,
    "product-groups": new ProductGroupService(new ProductGroupRepository()) as any,
    "product-categories": new ProductCategoryService(new ProductCategoryRepository()) as any,
    "product-types": new ProductTypeService(new ProductTypeRepository()) as any,
    units: new UnitService(new UnitRepository()) as any,
    "hsn-codes": new HsnCodeService(new HsnCodeRepository()) as any,
    taxes: new TaxService(new TaxRepository()) as any,
    brands: new BrandService(new BrandRepository()) as any,
    colours: new ColourService(new ColourRepository()) as any,
    sizes: new SizeService(new SizeRepository()) as any,
    styles: new StyleService(new StyleRepository()) as any,
    "order-types": new OrderTypeService(new OrderTypeRepository()) as any,
    transports: new TransportService(new TransportRepository()) as any,
    warehouses: new WarehouseService(new WarehouseRepository()) as any,
    destinations: new DestinationService(new DestinationRepository()) as any,
    "stock-rejection-types": new StockRejectionTypeService(new StockRejectionTypeRepository()) as any,
    currencies: new CurrencyService(new CurrencyRepository()) as any,
    priorities: new PriorityService(new PriorityRepository()) as any,
    "payment-terms": new PaymentTermService(new PaymentTermRepository()) as any,
    "accounting-year": new AccountingYearService(new AccountingYearRepository()) as any,
    months: new MonthService(new MonthRepository()) as any,
    "sales-account-types": new SalesAccountTypeService(new SalesAccountTypeRepository()) as any,
    ...genericCommonServices(),
  };
}

export const commonModuleDefinitions: CommonModuleDefinition[] = [
  { key: "countries", label: "Countries" },
  { key: "states", label: "States" },
  { key: "districts", label: "Districts" },
  { key: "cities", label: "Cities" },
  { key: "pincodes", label: "Pincodes" },
  { key: "contact-groups", label: "Contact Groups" },
  { key: "contact-types", label: "Contact Types" },
  { key: "address-types", label: "Address Types" },
  { key: "bank-names", label: "Bank Names" },
  { key: "bank-account-types", label: "Bank Account Types" },
  { key: "product-groups", label: "Product Groups" },
  { key: "product-categories", label: "Product Categories" },
  { key: "product-types", label: "Product Types" },
  { key: "units", label: "Units" },
  { key: "hsn-codes", label: "HSN Codes" },
  { key: "taxes", label: "Taxes" },
  { key: "brands", label: "Brands" },
  { key: "colours", label: "Colours" },
  { key: "sizes", label: "Sizes" },
  { key: "styles", label: "Styles" },
  { key: "order-types", label: "Order Types" },
  { key: "transports", label: "Transports" },
  { key: "warehouses", label: "Warehouses" },
  { key: "destinations", label: "Destinations" },
  { key: "stock-rejection-types", label: "Stock Rejection Types" },
  { key: "currencies", label: "Currencies" },
  { key: "priorities", label: "Priorities" },
  { key: "payment-terms", label: "Payment Terms" },
  { key: "accounting-year", label: "Accounting Year" },
  { key: "months", label: "Months" },
  { key: "sales-account-types", label: "Sales Account Types" },
  ...genericCommonDefinitions,
];
