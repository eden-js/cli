<user-admin-page>
  <div class="users-admin">

    <!-- page header -->
    <div class="mb-5 mt-0">
      <h4 class="page-title mb-0 text-center text-md-left">

        <i class="fa fa-user mr-3" /> Manage Users

        <a href="/admin/user/create" class="btn btn-primary float-right">
          <i class="fa fa-plus ml-2"></i> Create
        </a>

      </h4>
    </div>
    <!-- / page header -->

    <grid grid={ opts.grid } table-class="table table-bordered bg-inverse" title="Users Grid" />
  </div>
</user-admin-page>
