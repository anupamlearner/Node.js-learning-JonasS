class APIFeatures {
  constructor(mongooseQuery, userRequestQuery) {
    this.mongooseQuery = mongooseQuery;
    this.userRequestQuery = userRequestQuery;
  }

  filter() {
    const mongooseFilterQuery = { ...this.userRequestQuery };
    const excludedFields = ["page", "sort", "limit", "fields"];
    excludedFields.forEach((el) => delete mongooseFilterQuery[el]);

    // Advanced Filtering
    let filterQueryJson = JSON.stringify(mongooseFilterQuery);
    filterQueryJson = filterQueryJson.replace(
      /\b(gte|gt|lte|lt)\b/g,
      (match) => `$${match}`
    );

    this.mongooseQuery = this.mongooseQuery.find(JSON.parse(filterQueryJson));

    return this;
  }

  sort() {
    if (this.userRequestQuery.sort) {
      const sortBy = this.userRequestQuery.sort.split(",").join(" ");
      this.mongooseQuery = this.mongooseQuery.sort(sortBy);
    } else {
      this.mongooseQuery = this.mongooseQuery.sort("-createdAt");
    }

    return this;
  }

  limitFields() {
    if (this.userRequestQuery.fields) {
      const fields = this.userRequestQuery.fields.split(",").join(" ");
      this.mongooseQuery = this.mongooseQuery.select(fields);
    } else {
      this.mongooseQuery = this.mongooseQuery.select("-__v");
    }

    return this;
  }

  paginate() {
    const page = this.userRequestQuery.page * 1 || 1;
    const limit = this.userRequestQuery.limit * 1 || 100;
    const skip = (page - 1) * limit;

    this.mongooseQuery = this.mongooseQuery.skip(skip).limit(limit);

    return this;
  }

  execute() {
    return this.mongooseQuery;
  }
}

module.exports = APIFeatures;
