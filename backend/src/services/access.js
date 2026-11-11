const { Cohort, Resource } = require('../models');
const { forbidden, notFound } = require('../utils/errors');

async function mentorCohort(user, cohortId) {
  const cohort = await Cohort.findOne({ _id: cohortId, mentors: user._id });
  if (!cohort) throw forbidden('You are not assigned to this cohort');
  return cohort;
}

const mentorCohortIds = (user) => Cohort.find({ mentors: user._id }).distinct('_id');

async function mentorResource(user, resourceId) {
  const resource = await Resource.findById(resourceId);
  if (!resource) throw notFound('Resource not found');
  await mentorCohort(user, resource.cohort);
  return resource;
}

async function menteeResource(user, resourceId) {
  const resource = await Resource.findOne({ _id: resourceId, cohort: user.cohort, published: true });
  if (!resource) throw notFound('Resource not found');
  return resource;
}

module.exports = { mentorCohort, mentorCohortIds, mentorResource, menteeResource };
