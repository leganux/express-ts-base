import { Types } from 'mongoose';
const { ObjectId } = Types;

export const datatable_aggregate = function (model_: any, pipeline_: any[] = [], search_fields: any, options: any = {
    allowDiskUse: true,
    search_by_field: false
}, fIn_?: any, fOut_?: any) {
    return async function (req: any, res: any) {
        let pipeline2 = []
        let pipeline = [...pipeline_]

        try {
            let response = {
                message: 'OK',
                recordsFiltered: 0,
                recordsTotal: 0,
                total: 0,
                success: true,
                data: {}
            };

            let body = req.body

            if (fIn_ && typeof (fIn_) == 'function') {
                let res_ = await fIn_(req, pipeline)
                req = res_.req
                pipeline = res_.pipeline
            }

            let {where, whereObject, like} = req.body

            let order: any = {};
            let search_columns_or = []

            if (req.body.columns && req.body.order) {
                for (let item of req.body.order) {
                    let name = req.body.columns[item.column].data;
                    let search = (req.body.columns[item.column]?.search?.value) || '';
                    let dir = item.dir;
                    order[name] = dir.toUpperCase() == 'DESC' ? -1 : 1;

                    if (search !== "" && options.search_by_field) {
                        let inner: any = {}
                        inner[name] = {$regex: search, $options: 'i'}
                        search_columns_or.push(inner)
                    }
                }
            }

            if (options.search_by_field) {
                pipeline.push({
                    $match: {$or: search_columns_or}
                })
            }

            let fields = []
            if (search_fields) {
                if (typeof search_fields == 'string' && search_fields != '') {
                    fields = search_fields.split(',')
                }
                if (typeof search_fields == "object" && Array.isArray(search_fields)) {
                    fields = search_fields
                }
            }

            if (fields.length > 0 && body?.search?.value != '') {
                let or = []
                for (let item of fields) {
                    let inner: any = {}
                    if (isNaN(Number(body?.search?.value))) {
                        inner[item] = {$regex: body?.search?.value, $options: 'i'}
                    } else {
                        inner[item] = Number(body?.search?.value)
                    }
                    or.push(inner)
                }
                pipeline.push({
                    $match: {$or: or}
                })
            }

            let find: any = {};
            if (like) {
                for (const [key, val] of Object.entries(like)) {
                    find[key] = {$regex: String(val).trim(), $options: 'i'};
                }
            }
            if (where) {
                for (const [key, val] of Object.entries(where)) {
                    find[key] = val;
                }
            }
            if (whereObject) {
                for (const [key, val] of Object.entries(whereObject)) {
                    find[key] = new ObjectId(val);
                }
            }

            pipeline.push({
                $match: find
            })

            let table = await model_.aggregate(pipeline).allowDiskUse(options.allowDiskUse)
            let total = table.length

            pipeline2 = [...pipeline]

            pipeline2.push({
                $skip: Number(body?.start || 0)
            })
            pipeline2.push({
                $limit: Number(body?.length || 0)
            })

            pipeline2.push({
                $sort: order
            })

            let table2 = await model_.aggregate(pipeline2).allowDiskUse(options.allowDiskUse)

            response.data = table2
            response.recordsTotal = total
            response.recordsFiltered = total
            response.total = total

            if (fOut_ && typeof (fOut_) == 'function') {
                response = await fOut_(response)
            }

            res.status(200).json(response)

        } catch (e) {
            let response: any = {}
            response.error = e
            response.success = false
            response.message = e
            response.code = options && options.customErrorCode ? options.customErrorCode : 500
            response.data = {}
            res.status(options && options.customErrorCode ? options.customErrorCode : 500).json(response)
            throw e
        }
    }
}

export const aggregate = function (model_: any, pipeline_: any[] = [], options: any = {allowDiskUse: true}, fIn_?: any, fMid_?: any, fOut_?: any) {
    return async function (req: any, res: any) {
        let pipeline = [...pipeline_]
        try {
            let response = {
                error: '',
                success: false,
                message: '',
                code: 0,
                data: {}
            };

            if (fIn_ && typeof (fIn_) == 'function') {
                let res_ = await fIn_(req, pipeline)
                req = res_.req
                pipeline = res_.pipeline
            }

            let {select, where, whereObject, like, paginate, sort} = req.query

            let find: any = {};
            if (like) {
                for (const [key, val] of Object.entries(like)) {
                    find[key] = {$regex: String(val).trim(), $options: 'i'};
                }
            }
            if (where) {
                for (const [key, val] of Object.entries(where)) {
                    find[key] = val;
                }
            }
            if (whereObject) {
                for (const [key, val] of Object.entries(whereObject)) {
                    find[key] = new ObjectId(val);
                }
            }

            if (find && Object.entries(find).length > 0) {
                pipeline.push({
                    $match: find
                })
            }

            if (paginate && paginate.limit && paginate.page) {
                paginate.limit = Number(paginate.limit);
                paginate.page = Number(paginate.page);
                pipeline.push({
                    $skip: paginate.page * paginate.limit
                })
                pipeline.push({
                    $limit: paginate.limit
                })
            }
            if (sort) {
                let order: any = {};
                for (const [key, val] of Object.entries(sort)) {
                    order[key] = val;
                }
                pipeline.push({
                    $sort: order
                })
            }

            if (select) {
                let selector: any = {};
                for (const [key, val] of Object.entries(select)) {
                    if (val) {
                        selector[key] = "$" + key;
                    }
                }
                pipeline.push({
                    $replaceRoot: {
                        newRoot: selector
                    }
                })
            }

            if (fMid_ && typeof (fMid_) == 'function') {
                pipeline = await fMid_(pipeline)
            }

            response.data = await model_.aggregate(pipeline).allowDiskUse(options.allowDiskUse)

            if (fOut_ && typeof (fOut_) == 'function') {
                response = await fOut_(response)
            }
            res.status(200).json(response)

        } catch (e) {
            let response = {
                error: e,
                success: false,
                message: (e as any).stack,
                code: options && options.customErrorCode ? options.customErrorCode : 500,
                data: {}
            };
            response.error = e

            res.status(options && options.customErrorCode ? options.customErrorCode : 500).json(response)
            throw e
        }
    }
}
