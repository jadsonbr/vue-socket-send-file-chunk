<template>
  <div class="hello">
    <input
      type="file"
      accept="application/pdf"
      :multiple="false"
      ref="fileInput"
      @change="onFileChange"
    />
    <br />
    <br />
    <br />
    <br />
    <br />
    <button @click="teste">Enviar arquivo</button> <br />
    <br />
    {{ progress }} %
  </div>
</template>

<script>
export default {
  name: "HelloWorld",
  data() {
    return {
      chunk_size: 64 * 1024,
      done: false,
      file: null,
      progress: 0
    };
  },
  mounted() {},
  methods: {
    teste() {
      this.done = false;
      this.$socket.emit(
        "start-transfer",
        this.file.name,
        this.file.size,
        filename => {
          console.log(filename);
          if (!filename) {
            // the server rejected the transfer
            this.onReadError(this.file, 0, 0, "Upload rejected by server");
          } else {
            // the server allowed the transfer with the given filename
            this.server_filename = filename;
            this.readFileChunk(
              this.file,
              0,
              this.chunk_size,
              this.onReadSuccess.bind(this),
              this.onReadError.bind(this)
            );
          }
        }
      );
    },
    onFileChange($event) {
      const files = $event.target.files || $event.dataTransfer.files;
      // this.form.binaryDocumento = files[0];

      this.file = files[0];
    },
    readFileChunk(file, offset, length, success, error) {
      var end_offset = offset + length;
      if (end_offset > file.size) end_offset = file.size;
      var r = new FileReader();
      r.onload = function(file, offset, length, e) {
        if (e.target.error != null) error(file, offset, length, e.target.error);
        else success(file, offset, length, e.target.result);
      }.bind(r, file, offset, length);
      r.readAsArrayBuffer(file.slice(offset, end_offset));
    },
    onReadSuccess(file, offset, length, data) {
      if (this.done) {
        return;
      }
      if (!this.$socket.connected) {
        // the WebSocket connection was lost, wait until it comes back
        setTimeout(
          this.onReadSuccess.bind(this, file, offset, length, data),
          5000
        );
        return;
      }
      this.$socket.emit(
        "write-chunk",
        this.server_filename,
        offset,
        data,
        function(offset, ack) {
          if (!ack)
            this.onReadError(
              this.file,
              offset,
              0,
              "Transfer aborted by server"
            );
        }.bind(this, offset)
      );
      var end_offset = offset + length;
      // this.progress = parseInt((300 * end_offset) / file.size);
      this.progress = parseInt((100 * end_offset) / file.size);
      if (end_offset < file.size)
        this.readFileChunk(
          file,
          end_offset,
          this.chunk_size,
          this.onReadSuccess.bind(this),
          this.onReadError.bind(this)
        );
      else {
        // this.progress.classList.add('complete');
        // this.progress.classList.remove('in-progress');

        this.done = true;
        this.file = null;
        this.progress = 0;
        alert("Transferência concluida");
      }
    },
    onReadError(file, offset, length, error) {
      console.log("Upload error for " + file.name + ": " + error);
      alert("Upload falhou.");
      // this.progress.classList.add('error');
      // this.progress.classList.remove('in-progress');
      this.done = true;
      this.file = null;
      this.progress = 0;
    }
  }
};
</script>

<style scoped></style>
